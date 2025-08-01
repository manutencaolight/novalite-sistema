# Em: core/views.py (Versão Final, Corrigida e Reorganizada)

from django.shortcuts import render
from datetime import datetime
import os
from django.db import transaction
from django.http import HttpResponse
from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, status, filters, permissions
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from django_filters.rest_framework import DjangoFilterBackend


# Imports do ReportLab
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch

# Importa todos os modelos e serializers necessários
from .models import (
    Cliente, Equipamento, Evento, Funcionario, Veiculo,
    MaterialEvento, FotoPreEvento, ItemRetornado, RegistroManutencao, Usuario,
    Consumivel, ConsumivelEvento, AditivoOperacao
)
from .serializers import (
    ClienteSerializer, EquipamentoSerializer, EventoSerializer,
    FuncionarioSerializer, VeiculoSerializer, MaterialEventoSerializer,
    FotoPreEventoSerializer, ItemRetornadoComEventoSerializer, RegistroManutencaoSerializer,
    UsuarioSerializer, ConsumivelSerializer, ConsumivelEventoSerializer, AditivoOperacaoSerializer
)

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('empresa')
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]

class FuncionarioViewSet(viewsets.ModelViewSet):
    queryset = Funcionario.objects.all().order_by('nome')
    serializer_class = FuncionarioSerializer
    permission_classes = [permissions.IsAuthenticated]

class VeiculoViewSet(viewsets.ModelViewSet):
    queryset = Veiculo.objects.all().order_by('nome')
    serializer_class = VeiculoSerializer
    permission_classes = [permissions.IsAuthenticated]

class EquipamentoViewSet(viewsets.ModelViewSet):
    queryset = Equipamento.objects.all()
    serializer_class = EquipamentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['modelo', 'fabricante']
    filterset_fields = ['categoria']

    # --- CORREÇÃO 1: LÓGICA DE RETORNO DA MANUTENÇÃO ---
    @action(detail=True, methods=['post'])
    def retornar_da_manutencao(self, request, pk=None):
        try:
            equipamento = self.get_object()
            quantidade_retornada = request.data.get('quantidade')

            if quantidade_retornada is None:
                return Response({'error': 'A quantidade é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)
            
            quantidade_retornada = int(quantidade_retornada)
            
            if quantidade_retornada <= 0:
                return Response({'error': 'A quantidade deve ser maior que zero.'}, status=status.HTTP_400_BAD_REQUEST)

            if quantidade_retornada > equipamento.quantidade_manutencao:
                return Response({'error': f'Não é possível retornar {quantidade_retornada} itens. Apenas {equipamento.quantidade_manutencao} estão em manutenção.'}, status=status.HTTP_400_BAD_REQUEST)

            equipamento.quantidade_manutencao -= quantidade_retornada
            equipamento.quantidade_estoque += quantidade_retornada
            equipamento.save()

            serializer = self.get_serializer(equipamento)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # --- NOVA AÇÃO PARA ENVIAR EQUIPAMENTO PARA MANUTENÇÃO ---
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def enviar_para_manutencao(self, request, pk=None):
        equipamento = self.get_object()
        
        # Dados que virão do frontend
        quantidade = request.data.get('quantidade')
        descricao_problema = request.data.get('descricao_problema')

        # Validações
        if not all([quantidade, descricao_problema]):
            return Response(
                {'error': 'Quantidade e descrição do problema são obrigatórios.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quantidade = int(quantidade)
            if quantidade <= 0:
                raise ValueError("A quantidade deve ser positiva.")
        except (ValueError, TypeError):
            return Response({'error': 'A quantidade deve ser um número inteiro positivo.'}, status=status.HTTP_400_BAD_REQUEST)

        if quantidade > equipamento.quantidade_estoque:
            return Response(
                {'error': f'Estoque insuficiente. Apenas {equipamento.quantidade_estoque} unidades disponíveis.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Lógica de negócio
        # 1. Atualiza as quantidades no equipamento
        equipamento.quantidade_estoque -= quantidade
        equipamento.quantidade_manutencao += quantidade
        equipamento.save()

        # 2. Cria um registo de manutenção para cada unidade enviada
        for _ in range(quantidade):
            RegistroManutencao.objects.create(
                equipamento=equipamento,
                descricao_problema=descricao_problema,
                # Note que 'item_retornado' fica nulo, pois não veio de um evento
            )

        return Response({'status': f'{quantidade} unidade(s) de {equipamento.modelo} enviada(s) para manutenção com sucesso!'})


class ConsumivelViewSet(viewsets.ModelViewSet):
    queryset = Consumivel.objects.all()
    serializer_class = ConsumivelSerializer
    permission_classes = [IsAuthenticated]

class ConsumivelEventoViewSet(viewsets.ModelViewSet):
    queryset = ConsumivelEvento.objects.all()
    serializer_class = ConsumivelEventoSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def toggle_conferencia(self, request, pk=None):
        try:
            # Pega o objeto específico (ex: o consumível de evento com id=pk)
            consumivel_evento = self.get_object()
            
            # Inverte o valor booleano (se for True, vira False, e vice-versa)
            consumivel_evento.conferido = not consumivel_evento.conferido
            
            # Salva a alteração no banco de dados
            consumivel_evento.save()
            
            # Retorna uma resposta de sucesso para o frontend
            return Response({'status': 'Conferência do consumível atualizada.'})
        except Exception as e:
            # Retorna um erro se algo falhar
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RegistroManutencaoViewSet(viewsets.ModelViewSet):
    queryset = RegistroManutencao.objects.exclude(status='REPARADO').order_by('-data_entrada')
    serializer_class = RegistroManutencaoSerializer
    permission_classes = [permissions.IsAuthenticated]    

    # --- AJUSTE: MÉTODO DUPLICADO REMOVIDO, FICOU APENAS A VERSÃO COMPLETA ---
    @action(detail=True, methods=['post'])
    def atualizar_status(self, request, pk=None):
        try:
            registro = self.get_object()
            novo_status = request.data.get('status')
            solucao = request.data.get('solucao_aplicada', '')
            if not novo_status: return Response({'error': 'O novo status é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
            registro.status = novo_status
            registro.solucao_aplicada = solucao
            if novo_status == 'REPARADO':
                equipamento = registro.equipamento
                if equipamento.quantidade_manutencao > 0:
                    equipamento.quantidade_manutencao -= 1
                    equipamento.quantidade_estoque += 1
                    equipamento.save()
                registro.data_saida = timezone.now()
            registro.save()
            return Response({'status': 'Status da manutenção atualizado com sucesso!'})
        except Exception as e: return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegistroManutencaoHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Esta view mostra apenas os registros de manutenção concluídos (o histórico).
    """
    queryset = RegistroManutencao.objects.filter(status='REPARADO').order_by('-data_saida')
    serializer_class = RegistroManutencaoSerializer
    permission_classes = [permissions.IsAuthenticated]

class MaterialEventoViewSet(viewsets.ModelViewSet):
    queryset = MaterialEvento.objects.all()
    serializer_class = MaterialEventoSerializer

    @action(detail=True, methods=['post'])
    def toggle_conferencia(self, request, pk=None):
        try:
            material = self.get_object()
            # Simplesmente inverte o status atual do campo 'conferido'
            material.conferido = not material.conferido
            material.save()
            return Response({'status': 'Conferência atualizada.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


    # --- NOVA AÇÃO PARA RESOLVER PENDÊNCIAS ---
    @action(detail=True, methods=['post'])
    def resolver_pendencia(self, request, pk=None):
        material = self.get_object()
        solucao = request.data.get('solucao') # Ex: 'SUBLOCADO', 'EMPRESTIMO', 'COMPRADO'

        if material.status_suprimento != 'PENDENTE':
            return Response({'error': 'Este item não tem pendência de estoque.'}, status=status.HTTP_400_BAD_REQUEST)

        solucoes_validas = ['SUBLOCADO', 'EMPRESTIMO', 'COMPRADO']
        if solucao not in solucoes_validas:
            return Response({'error': 'A solução fornecida é inválida.'}, status=status.HTTP_400_BAD_REQUEST)

        material.status_suprimento = solucao
        # Usamos update_fields para não disparar a lógica de verificação de estoque novamente
        material.save(update_fields=['status_suprimento']) 

        serializer = self.get_serializer(material)
        return Response(serializer.data)


class FotoPreEventoViewSet(viewsets.ModelViewSet):
    queryset = FotoPreEvento.objects.all()
    serializer_class = FotoPreEventoSerializer

class EventoViewSet(viewsets.ModelViewSet):
    queryset = Evento.objects.all().order_by('-data_evento')
    serializer_class = EventoSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # Associa o usuário logado (request.user) ao campo 'criado_por'
        serializer.save(criado_por=self.request.user)

    def perform_update(self, serializer):
        evento = self.get_object()
        # Verifica se o usuário que está tentando editar é o mesmo que criou
        if evento.criado_por != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("Você não tem permissão para editar esta operação.")
        serializer.save()

          
    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        try:
            original_evento = self.get_object()
        
            # --- LÓGICA ATUALIZADA PARA RECEBER OS NOVOS CAMPOS ---
            novo_nome = request.data.get('novo_nome')
            nova_data_str = request.data.get('nova_data_evento')
            nova_data_termino_str = request.data.get('nova_data_termino') # Novo

            if not nova_data_str:
                return Response({'error': 'A nova data de início é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)

            nova_data_inicio = datetime.strptime(nova_data_str, '%Y-%m-%d').date()
            # Converte a data de término apenas se ela for fornecida
            nova_data_termino = datetime.strptime(nova_data_termino_str, '%Y-%m-%d').date() if nova_data_termino_str else None

            materiais_originais = list(original_evento.materialevento_set.all())
            equipe_original_ids = list(original_evento.equipe.all().values_list('id', flat=True))
          
            novo_evento = original_evento
            novo_evento.pk = None
            novo_evento.id = None
        
            # Usa o novo nome se fornecido, senão cria um padrão
            novo_evento.nome = novo_nome or f"Cópia de - {original_evento.nome or 'Operação'}"
        
            novo_evento.data_evento = nova_data_inicio
            novo_evento.data_termino = nova_data_termino # Define a nova data de término
            novo_evento.status = 'PLANEJAMENTO'
            novo_evento.observacao_correcao = ""
            novo_evento.save()
        
            for material in materiais_originais:
                MaterialEvento.objects.create(
                    evento=novo_evento,
                    equipamento=material.equipamento,
                    item_descricao=material.item_descricao,
                    quantidade=material.quantidade
                )
        
            if equipe_original_ids:
                novo_evento.equipe.set(equipe_original_ids)

            serializer = self.get_serializer(novo_evento)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['post'])
    def mudar_status(self, request, pk=None):
        evento = self.get_object()
        novo_status = request.data.get('status')
        status_validos = [s[0] for s in Evento.STATUS_CHOICES]
        if novo_status not in status_validos:
            return Response({'error': 'Status inválido fornecido.'}, status=status.HTTP_400_BAD_REQUEST)

        if novo_status == 'FINALIZADO' and evento.status == 'EM_ANDAMENTO':
            materiais_pendentes = MaterialEvento.objects.filter(evento=evento).exclude(
                quantidade_separada=F('quantidade_retornada_ok') + F('quantidade_retornada_defeito')
            )
            if materiais_pendentes.exists():
                nomes = ", ".join([m.equipamento.modelo for m in materiais_pendentes if m.equipamento])
                return Response({'error': f"Não é possível finalizar. Retorno pendente para: {nomes}."}, status=status.HTTP_400_BAD_REQUEST)

        evento.status = novo_status
        evento.save()
        return Response({'status': f'Status atualizado para {evento.get_status_display()}'})

    @action(detail=True, methods=['post'])
    def aprovar_lista(self, request, pk=None):
        evento = self.get_object()
        if evento.status != 'AGUARDANDO_CONFERENCIA':
            return Response({'error': 'Ação não permitida para o status atual.'}, status=400)

        # --- VERIFICAÇÃO DE CONFERÊNCIA ---
        itens_nao_conferidos = MaterialEvento.objects.filter(evento=evento, conferido=False).count()
        if itens_nao_conferidos > 0:
            return Response({'error': f'Ainda há {itens_nao_conferidos} item(ns) pendente(s) de conferência.'}, status=400)

        materiais = MaterialEvento.objects.filter(evento=evento)
        for material in materiais:
            if material.equipamento and material.quantidade > material.equipamento.quantidade_estoque:
                return Response({'error': f"Estoque insuficiente para '{material.equipamento.modelo}'. A lista deve ser corrigida."}, status=400)
        
        evento.status = 'AGUARDANDO_SAIDA'
        evento.observacao_correcao = ""
        evento.save()
        return Response({'status': 'Lista conferida e aprovada. Aguardando saída.'})

    @action(detail=True, methods=['post'])
    def retornar_para_correcao(self, request, pk=None):
        evento = self.get_object()
        if evento.status != 'AGUARDANDO_CONFERENCIA':
            return Response({'error': 'Ação não permitida para o status atual.'}, status=400)
        
        observacao = request.data.get('observacao')
        if not observacao:
            return Response({'error': 'Uma observação é necessária para retornar.'}, status=400)
            
        MaterialEvento.objects.filter(evento=evento).update(conferido=False)
        evento.status = 'PLANEJAMENTO'
        evento.observacao_correcao = observacao
        evento.save()
        return Response({'status': 'Operação retornada para correção.'})
        
    # --- FUNÇÃO 'dar_saida' ADICIONADA AQUI ---
    @action(detail=True, methods=['post'])
    def dar_saida(self, request, pk=None):
        evento = self.get_object()
        if evento.status not in ['AGUARDANDO_SAIDA', 'EM_ANDAMENTO']:
            return Response({'error': 'Ação não permitida para o status atual.'}, status=status.HTTP_400_BAD_REQUEST)
        
        materiais_saida = request.data.get('materiais', [])
        if not materiais_saida:
            return Response({'error': 'Nenhum material foi especificado para a saída.'}, status=400)
        try:
            for item in materiais_saida:
                material = MaterialEvento.objects.get(id=item['id'], evento=evento)
                qtd_saida = int(item['qtd'])
                if qtd_saida > (material.quantidade - material.quantidade_separada):
                    return Response({'error': f"Quantidade de saída para '{material.equipamento.modelo}' excede a planejada."}, status=400)
                if material.equipamento and qtd_saida > material.equipamento.quantidade_estoque:
                    return Response({'error': f"Estoque insuficiente para {material.equipamento.modelo}."}, status=400)
                if material.equipamento:
                    material.equipamento.quantidade_estoque -= qtd_saida
                    material.equipamento.save()
                material.quantidade_separada += qtd_saida
                material.save()
            
            # Se era a primeira saída, muda o status para "Em Andamento"
            if evento.status == 'AGUARDANDO_SAIDA':
                evento.status = 'EM_ANDAMENTO'
                evento.save()

            return Response({'status': 'Saída de material registrada com sucesso!', 'novo_status': evento.get_status_display()})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            
    @action(detail=True, methods=['post'], url_path='manage-team')
    def manage_team(self, request, pk=None):
        evento = self.get_object()
        funcionario_ids = request.data.get('funcionario_ids')
        if funcionario_ids is None:
            return Response({'error': 'A chave "funcionario_ids" é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            funcionarios = Funcionario.objects.filter(id__in=funcionario_ids)
            evento.equipe.set(funcionarios)
            return Response({'status': 'Equipe atualizada com sucesso!'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    # --- LÓGICA DE RETORNO CORRIGIDA E COMPLETA ---
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def registrar_retorno(self, request, pk=None):
        evento = self.get_object()
        if evento.status != 'EM_ANDAMENTO':
            return Response({'error': 'A operação não está "Em Andamento".'}, status=status.HTTP_400_BAD_REQUEST)

        novos_retornos = request.data.get('retornos', [])
        if not novos_retornos:
            return Response({'error': 'Nenhum item de retorno foi especificado.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            for item_data in novos_retornos:
                material = MaterialEvento.objects.get(id=item_data['material_evento_id'], evento=evento)
                quantidade = int(item_data['quantidade'])
                condicao = item_data['condicao']
                observacao = item_data.get('observacao', '')

                total_ja_retornado = material.itens_retornados.aggregate(total=Sum('quantidade'))['total'] or 0
                total_pendente = material.quantidade_separada - total_ja_retornado

                if quantidade > total_pendente:
                    return Response({'error': f"Quantidade de retorno para '{material.equipamento.modelo}' excede a pendente."}, status=400)

                novo_item_retornado = ItemRetornado.objects.create(
                    material_evento=material,
                    quantidade=quantidade,
                    condicao=condicao,
                    observacao=observacao
                )

                if material.equipamento:
                    if condicao == 'OK':
                        material.equipamento.quantidade_estoque += quantidade
                    else:
                        material.equipamento.quantidade_manutencao += quantidade
                        for _ in range(quantidade):
                            RegistroManutencao.objects.create(
                                equipamento=material.equipamento,
                                item_retornado=novo_item_retornado,
                                descricao_problema=f"Retornou da operação '{evento.nome}' como '{novo_item_retornado.get_condicao_display()}'. Obs: {observacao}"
                            )
                    material.equipamento.save()

            todos_materiais = MaterialEvento.objects.filter(evento=evento)
            ainda_ha_pendencia = any(m.quantidade_separada > (m.itens_retornados.aggregate(total=Sum('quantidade'))['total'] or 0) for m in todos_materiais)

            if not ainda_ha_pendencia:
                evento.status = 'FINALIZADO'
                evento.save()
                return Response({'status': 'Retorno registrado e operação finalizada com sucesso!'})
            else:
                return Response({'status': 'Retorno parcial registrado com sucesso!'})

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def perform_update(self, serializer):
        # Trava a edição da lista de materiais se não estiver em planejamento
        if self.get_object().status != 'PLANEJAMENTO':
            raise PermissionDenied("A lista de material não pode ser alterada após ser enviada para a logística.")
        serializer.save()


    @action(detail=True, methods=['post'])
    def enviar_para_conferencia(self, request, pk=None):
        evento = self.get_object()
        if evento.status != 'PLANEJAMENTO':
            return Response({'error': 'Ação não permitida para o status atual.'}, status=400)

        evento.status = 'AGUARDANDO_CONFERENCIA'
        evento.save()
        return Response({'status': f'Operação enviada para conferência.'})

    @action(detail=True, methods=['post'])
    def retornar_para_correcao(self, request, pk=None):
        evento = self.get_object()
        if evento.status != 'AGUARDANDO_CONFERENCIA':
            return Response({'error': 'Ação não permitida para o status atual.'}, status=400)

        observacao = request.data.get('observacao')
        if not observacao:
            return Response({'error': 'Uma observação é necessária para retornar para correção.'}, status=400)

        # Reseta os checks de conferência e retorna ao planejamento
        MaterialEvento.objects.filter(evento=evento).update(conferido=False)
        evento.status = 'PLANEJAMENTO'
        evento.observacao_correcao = observacao
        evento.save()
        return Response({'status': 'Operação retornada para correção.'})

    # --- AÇÃO DE REFORÇO ADICIONADA DE VOLTA ---
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def adicionar_reforco(self, request, pk=None):
        evento = self.get_object()
        if evento.status != 'EM_ANDAMENTO':
            return Response({'error': 'Só é possível adicionar reforço a operações "Em Andamento".'}, status=status.HTTP_400_BAD_REQUEST)

        itens_reforco = request.data.get('materiais', [])
        if not itens_reforco:
            return Response({'error': 'Nenhum material de reforço foi especificado.'}, status=400)

        try:
            for item_data in itens_reforco:
                equipamento_id = item_data.get('equipamento_id')
                quantidade = int(item_data.get('quantidade', 0))

                if not equipamento_id or quantidade <= 0:
                    continue

                equipamento = Equipamento.objects.get(id=equipamento_id)
                
                if quantidade > equipamento.quantidade_estoque:
                    return Response({'error': f"Estoque insuficiente para o reforço de '{equipamento.modelo}'."}, status=400)
                
                equipamento.quantidade_estoque -= quantidade
                equipamento.save()

                material, created = MaterialEvento.objects.get_or_create(
                    evento=evento,
                    equipamento=equipamento,
                    defaults={'quantidade': 0}
                )
                
                material.quantidade += quantidade
                material.quantidade_separada += quantidade
                material.save()
            
            return Response({'status': 'Material de reforço adicionado e com saída registrada com sucesso!'})
        except Equipamento.DoesNotExist:
            return Response({'error': 'Equipamento de reforço não encontrado.'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    @transaction.atomic # Garante que ou tudo funciona, ou nada é alterado
    def cancelar_operacao(self, request, pk=None):
        evento = self.get_object()
        user = request.user
        
        # Dados enviados pelo frontend
        motivo = request.data.get('motivo')
        password = request.data.get('password')

        # 1. Validação de segurança e regras de negócio
        if not motivo or not password:
            return Response({'error': 'Motivo e senha são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verifica se o usuário logado é um administrador
        if user.role != 'admin':
             return Response({'error': 'Apenas administradores podem cancelar operações.'}, status=status.HTTP_403_FORBIDDEN)

        # Verifica a senha do administrador
        if not user.check_password(password):
            return Response({'error': 'Senha de administrador incorreta.'}, status=status.HTTP_403_FORBIDDEN)

        # Verifica se a operação pode ser cancelada
        if evento.status not in ['PLANEJAMENTO', 'AGUARDANDO_CONFERENCIA', 'AGUARDANDO_SAIDA']:
            return Response({'error': 'Esta operação não pode mais ser cancelada.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Lógica de Negócio: Reverter o estoque (se necessário)
        # Esta etapa é crucial para a integridade do seu inventário.
        # Como o material ainda não saiu, não precisamos nos preocupar com a quantidade_separada.
        # A verificação de estoque no modelo já nos protege.

        # 3. Atualiza o status da operação
        evento.status = 'CANCELADO'
        evento.motivo_cancelamento = motivo
        evento.save()

        return Response({'status': 'Operação cancelada com sucesso!'})
    
class AditivoOperacaoViewSet(viewsets.ModelViewSet):
    queryset = AditivoOperacao.objects.all()
    serializer_class = AditivoOperacaoSerializer
    permission_classes = [IsAuthenticated]

    # --- MÉTODO ATUALIZADO COM A LÓGICA DE INTEGRAÇÃO ---
    @transaction.atomic # Garante que todas as operações sejam bem-sucedidas ou nenhuma
    def perform_create(self, serializer):
        # 1. Salva o aditivo e associa o usuário logado
        aditivo = serializer.save(criado_por=self.request.user)
        
        # 2. Pega a operação original (o evento)
        operacao_original = aditivo.operacao_original

        # 3. Itera sobre os materiais do aditivo que acabaram de ser criados
        for material_aditivo in aditivo.materiais_aditivo.all():
            equipamento = material_aditivo.equipamento
            quantidade_adicionada = material_aditivo.quantidade

            # Verifica se este equipamento já existe na lista de materiais da operação original
            material_existente, created = MaterialEvento.objects.get_or_create(
                evento=operacao_original,
                equipamento=equipamento,
                defaults={'quantidade': 0} # Valor padrão se for um item novo
            )

            # Adiciona a nova quantidade à quantidade planejada
            material_existente.quantidade += quantidade_adicionada
            material_existente.save()

            # --- ALERTA PARA A LOGÍSTICA (Opcional, mas recomendado) ---
            # Podemos criar um campo de notificação no modelo Evento no futuro
            # Por enquanto, a simples adição do item já o fará aparecer na conferência.

    
def home_view(request):
    return render(request, 'index.html')

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_equipment_categories(request):
    categorias = Equipamento.CATEGORIAS
    formatted_categories = [{'value': cat[0], 'label': cat[1]} for cat in categorias]
    return Response(formatted_categories)
# --- FUNÇÃO ESSENCIAL PARA O FILTRO DE CATEGORIAS ---

# --- Views para Funções Específicas ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    total_equip_estoque = Equipamento.objects.aggregate(total=Sum('quantidade_estoque'))['total'] or 0
    total_equip_manutencao = Equipamento.objects.aggregate(total=Sum('quantidade_manutencao'))['total'] or 0
    proximos_eventos = Evento.objects.filter(data_evento__gte=datetime.now().date()).order_by('data_evento')[:5]
    proximos_eventos_serializer = EventoSerializer(proximos_eventos, many=True)
    stats = {
        'total_equipamentos': total_equip_estoque,
        'em_manutencao': total_equip_manutencao,
        'proximos_eventos': proximos_eventos_serializer.data
    }
    return Response(stats)

def evento_report_pdf(request, evento_id):
    try:
        evento = Evento.objects.get(id=evento_id)
    except Evento.DoesNotExist:
        return HttpResponse("Evento não encontrado.", status=404)

    response = HttpResponse(content_type='application/pdf')
    
    # Lógica do Título Dinâmico
    if evento.tipo_evento == 'PROPRIO':
        main_title_text = "Relatório Completo do Evento"
        subtitle_text = evento.nome or "Evento Sem Nome"
        filename_prefix = evento.nome or "Evento"
    else:
        main_title_text = evento.get_tipo_evento_display()
        subtitle_text = f"Para: {evento.cliente.empresa}"
        filename_prefix = evento.get_tipo_evento_display()

    filename = f"{filename_prefix.replace(' ', '_')}_{evento.id}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    doc = SimpleDocTemplate(response, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    styles = getSampleStyleSheet()
    
    # --- CORREÇÃO: Bloco de código abaixo foi realinhado ---
    story = []
    
    # 1. Cabeçalho com Logo
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'img', 'novalite_logo.png')
    logo_imagem = RLImage(logo_path, width=1.5*inch, height=0.75*inch) if os.path.exists(logo_path) else Paragraph("")
    
    header_text = [
        Paragraph(main_title_text, styles['h1']),
        Paragraph(f"<b>{subtitle_text}</b>", styles['h2']),
    ]
    if evento.data_montagem:
        header_text.append(Paragraph(f"<b>Montagem:</b> {evento.data_montagem.strftime('%d/%m/%Y')}", styles['Normal']))
    if evento.data_termino:
        header_text.append(Paragraph(f"<b>Término/Retorno:</b> {evento.data_termino.strftime('%d/%m/%Y')}", styles['Normal']))

    header_table = Table([[logo_imagem, header_text]], colWidths=[2*inch, 5*inch], style=[('VALIGN', (0,0), (-1,-1), 'TOP')])
    story.append(header_table)
    story.append(Spacer(1, 0.2*inch))

    # 2. Informações Gerais
    info_data = [
        [Paragraph("<b>Cliente:</b>", styles['Normal']), Paragraph(evento.cliente.empresa if evento.cliente else 'N/A', styles['Normal'])],
        [Paragraph("<b>Local:</b>", styles['Normal']), Paragraph(evento.local or 'N/A', styles['Normal'])],
    ]
    if evento.responsavel_local_nome:
        info_data.append([Paragraph("<b>Responsável no Local:</b>", styles['Normal']), Paragraph(f"{evento.responsavel_local_nome} ({evento.responsavel_local_contato or 'sem contato'})", styles['Normal'])])
    
    story.append(Table(info_data, colWidths=[1.8*inch, 5.2*inch]))
    story.append(Spacer(1, 0.25*inch))

    # 3. Detalhes Técnicos (Pré-Evento)
    story.append(Paragraph("<b>Detalhes Técnicos (Pré-Evento)</b>", styles['h3']))
    tecnicos_data = [
        [Paragraph("<b>Tipo de Energia:</b>", styles['Normal']), Paragraph(evento.get_tipo_energia_display() or 'Não informado', styles['Normal'])],
        [Paragraph("<b>Distância do Ponto (m):</b>", styles['Normal']), Paragraph(str(evento.distancia_energia_metros), styles['Normal'])],
        [Paragraph("<b>Acesso de Veículo:</b>", styles['Normal']), Paragraph(evento.get_ponto_acesso_veiculo_display() or 'Não informado', styles['Normal'])],
        [Paragraph("<b>Necessita Gerador:</b>", styles['Normal']), Paragraph("Sim" if evento.necessita_gerador else "Não", styles['Normal'])],
    ]
    if evento.observacoes_tecnicas:
        tecnicos_data.append([Paragraph("<b>Observações:</b>", styles['Normal']), Paragraph(evento.observacoes_tecnicas.replace('\n', '<br/>'), styles['Normal'])])
    story.append(Table(tecnicos_data, colWidths=[1.8*inch, 5.2*inch]))
    story.append(Spacer(1, 0.25*inch))

    # 4. Fotos do Pré-Evento
    fotos = evento.fotos.all()
    if fotos:
        story.append(Paragraph("<b>Fotos do Local</b>", styles['h3']))
        photo_data = []
        row = []
        for foto in fotos:
            if os.path.exists(foto.imagem.path):
                img = RLImage(foto.imagem.path, width=2.2*inch, height=1.6*inch)
                row.append(img)
                if len(row) == 3:
                    photo_data.append(row)
                    row = []
        if row: photo_data.append(row)
        if photo_data:
            story.append(Table(photo_data))
        story.append(Spacer(1, 0.25*inch))

    # 5. Lista de Materiais
    materiais = evento.materialevento_set.all()
    if materiais:
        story.append(Paragraph("<b>Lista de Materiais</b>", styles['h3']))
        data = [["Item / Modelo", "Qtd."]]
        for item in materiais:
            data.append([item.equipamento.modelo if item.equipamento else item.item_descricao, item.quantidade])
        table = Table(data, colWidths=[5.5*inch, 1.5*inch], style=[('BACKGROUND', (0,0), (-1,0), colors.grey), ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke), ('GRID', (0,0), (-1,-1), 1, colors.black), ('ALIGN', (1,1), (-1,-1), 'CENTER'), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold')])
        story.append(table)
        story.append(Spacer(1, 0.25*inch))
    
    consumiveis = evento.consumiveis_set.all()
    if consumiveis:
        story.append(Paragraph("<b>Lista de Consumíveis</b>", styles['h3']))
        data_consumiveis = [["Item", "Qtd.", "Unidade"]]
        for item in consumiveis:
            data_consumiveis.append([item.consumivel.nome, item.quantidade, item.consumivel.unidade_medida])
        
        table_consumiveis = Table(data_consumiveis, colWidths=[4.5*inch, 1*inch, 1.5*inch])
        table_consumiveis.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('ALIGN', (1,1), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold')
        ]))
        story.append(table_consumiveis)
        story.append(Spacer(1, 0.25*inch))    

    # 6. Equipe Designada
    equipe = evento.equipe.all()
    if equipe:
        story.append(Paragraph("<b>Equipe Designada</b>", styles['h3']))
        data = [["Nome", "Função"]]
        for membro in equipe:
            data.append([membro.nome, membro.funcao])
        table = Table(data, colWidths=[3.5*inch, 3.5*inch], style=[('BACKGROUND', (0,0), (-1,0), colors.HexColor("#4F81BD")), ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke), ('GRID', (0,0), (-1,-1), 1, colors.black), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold')])
        story.append(table)
        story.append(Spacer(1, 0.25*inch))

    # 7. Frota Designada
    veiculos = evento.veiculos.all()
    if veiculos:
        story.append(Paragraph("<b>Frota Designada</b>", styles['h3']))
        data = [["Veículo", "Placa"]]
        for veiculo in veiculos:
            data.append([veiculo.nome, veiculo.placa])
        table = Table(data, colWidths=[3.5*inch, 3.5*inch], style=[('BACKGROUND', (0,0), (-1,0), colors.darkgreen), ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke), ('GRID', (0,0), (-1,-1), 1, colors.black), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold')])
        story.append(table)

    doc.build(story)
    return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def gerar_guia_saida_pdf(request, evento_id):
    try:
        evento = Evento.objects.get(id=evento_id)
        itens_da_guia = request.data.get('itens', []) 

        if not itens_da_guia:
            return Response({'error': 'Nenhum equipamento fornecido para a guia.'}, status=400)

        response = HttpResponse(content_type='application/pdf')
        timestamp = datetime.now().strftime("%Y%m%d-%H%M")
        filename = f"Guia_Saida_{evento.nome or evento.id}_{timestamp}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        doc = SimpleDocTemplate(response, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        styles = getSampleStyleSheet()
        story = []

        # --- CABEÇALHO ATUALIZADO ---
        story.append(Paragraph("Guia de Saída de Material", styles['h1']))
        story.append(Paragraph(f"<b>Operação:</b> {evento.nome or evento.get_tipo_evento_display()}", styles['h2']))
        story.append(Paragraph(f"<b>Cliente:</b> {evento.cliente.empresa}", styles['Normal']))
        
        # --- ENDEREÇO ADICIONADO AQUI ---
        if evento.local:
            story.append(Paragraph(f"<b>Endereço / Local:</b> {evento.local}", styles['Normal']))
        
        if evento.data_evento:
            story.append(Paragraph(f"<b>Data de Saída:</b> {evento.data_evento.strftime('%d/%m/%Y')}", styles['Normal']))
        if evento.data_termino:
            story.append(Paragraph(f"<b>Data de Retorno Previsto:</b> {evento.data_termino.strftime('%d/%m/%Y')}", styles['Normal']))
        
        story.append(Paragraph(f"<b>Data de Emissão do Documento:</b> {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))

        # --- Secção de Equipamentos (sem alterações) ---
        story.append(Paragraph("<b>Equipamentos</b>", styles['h3']))
        data_equipamentos = [["Item / Modelo", "Qtd."]]
        for item in itens_da_guia:
            data_equipamentos.append([item['modelo'], item['qtd']])
        table_equipamentos = Table(data_equipamentos, colWidths=[5.5*inch, 1.5*inch])
        table_equipamentos.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.darkgrey), ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke),
            ('GRID', (0,0), (-1,-1), 1, colors.black), ('ALIGN', (1,1), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold')
        ]))
        story.append(table_equipamentos)
        story.append(Spacer(1, 0.25*inch))

        # --- Secção de Consumíveis (sem alterações) ---
        consumiveis = evento.consumiveis_set.all()
        if consumiveis:
            story.append(Paragraph("<b>Consumíveis</b>", styles['h3']))
            data_consumiveis = [["Item / Modelo", "Qtd."]]
            for item in consumiveis:
                data_consumiveis.append([item.consumivel.nome, item.quantidade])
            table_consumiveis = Table(data_consumiveis, colWidths=[5.5*inch, 1.5*inch])
            table_consumiveis.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
                ('GRID', (0,0), (-1,-1), 1, colors.black), ('ALIGN', (1,1), (-1,-1), 'CENTER'), 
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold')]))
            story.append(table_consumiveis)

        # --- Assinaturas (sem alterações) ---
        story.append(Spacer(1, 1*inch))
        assinaturas = [
            ["__________________________________", "__________________________________"],
            [Paragraph("Conferido por (Novalite)", styles['Normal']), Paragraph("Recebido por (Cliente/Produção)", styles['Normal'])]
        ]
        story.append(Table(assinaturas, colWidths=[3*inch, 3*inch], style=[('ALIGN', (0,0), (-1,-1), 'CENTER')]))

        doc.build(story)
        return response
    except Exception as e:
        return Response({'error': str(e)}, status=500)

        
# Em: core/views.py

@api_view(['GET'])
def gerar_relatorio_avarias_pdf(request, evento_id):
    try:
        evento = Evento.objects.get(id=evento_id)
        
        # --- LÓGICA DE BUSCA CORRIGIDA E MAIS ROBUSTA ---
        # Busca todos os itens retornados para este evento que NÃO ESTÃO em "Bom Estado"
        itens_avariados = ItemRetornado.objects.filter(
            material_evento__evento_id=evento_id
        ).exclude(condicao='OK').order_by('material_evento__equipamento__modelo')

        if not itens_avariados.exists():
            return HttpResponse("Nenhum item com avaria foi registrado para esta operação.", status=404)

        response = HttpResponse(content_type='application/pdf')
        filename = f"Relatorio_Avarias_{evento.nome.replace(' ', '_')}_{evento.id}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        doc = SimpleDocTemplate(response, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        styles = getSampleStyleSheet()
        story = []

        # 1. Cabeçalho
        story.append(Paragraph("Relatório de Perdas e Avarias", styles['h1']))
        story.append(Paragraph(f"<b>Operação:</b> {evento.nome or evento.get_tipo_evento_display()}", styles['h2']))
        story.append(Paragraph(f"<b>Cliente:</b> {evento.cliente.empresa}", styles['Normal']))
        story.append(Paragraph(f"<b>Data de Emissão:</b> {datetime.now().strftime('%d/%m/%Y')}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # 2. Tabela de Itens Avariados
        data = [["Item / Modelo", "Qtd.", "Condição", "Observação"]]
        for item in itens_avariados:
            data.append([
                item.material_evento.equipamento.modelo if item.material_evento.equipamento else item.material_evento.item_descricao,
                item.quantidade,
                item.get_condicao_display(),
                item.observacao or "Nenhuma"
            ])
        
        table = Table(data, colWidths=[3*inch, 0.5*inch, 1*inch, 3*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#c00000")),
            ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold')
        ]))
        story.append(table)

        doc.build(story)
        return response

    except Evento.DoesNotExist:
        return HttpResponse("Operação não encontrada.", status=404)
    except Exception as e:
        return HttpResponse(f"Ocorreu um erro ao gerar o PDF: {e}", status=500)

# Em: core/views.py (adicionar no final do arquivo)

# --- FUNÇÃO CORRIGIDA COM A IMPORTAÇÃO CERTA ---
@api_view(['GET'])
def relatorio_de_avarias_recentes(request):
    """
    Retorna uma lista dos últimos 10 itens que retornaram com avarias
    de operações finalizadas.
    """
    avarias = ItemRetornado.objects.filter(
        material_evento__evento__status='FINALIZADO'
    ).exclude(condicao='OK').order_by('-data_retorno')[:10]
    
    serializer = ItemRetornadoComEventoSerializer(avarias, many=True)
    return Response(serializer.data)
 
@api_view(['POST'])
@permission_classes([AllowAny]) # Permite acesso sem autenticação
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Usuário e senha são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = Usuario.objects.get(username=username)
        if user.check_password(password):
            return Response({
                'username': user.username,
                'role': user.role
            })
        else:
            return Response({'error': 'Credenciais inválidas.'}, status=status.HTTP_401_UNAUTHORIZED)
    except Usuario.DoesNotExist:
        return Response({'error': 'Credenciais inválidas.'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST']) # Mude para POST se envia dados, ou GET se apenas busca
@permission_classes([IsAuthenticated])
def gerar_guia_reforco_pdf(request, evento_id):
    try:
        evento = Evento.objects.get(id=evento_id)
        itens_do_reforco = request.data.get('itens', []) 

        if not itens_do_reforco:
            return Response({'error': 'Nenhum item fornecido para a guia de reforço.'}, status=400)

        response = HttpResponse(content_type='application/pdf')
        timestamp = timezone.now().strftime("%Y%m%d-%H%M")
        filename = f"Guia_Reforco_{evento.nome or evento.id}_{timestamp}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        doc = SimpleDocTemplate(response, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph("Guia de Saída de Material Extra (Reforço)", styles['h1']))
        story.append(Paragraph(f"<b>Operação:</b> {evento.nome or evento.get_tipo_evento_display()}", styles['h2']))
        story.append(Paragraph(f"<b>Cliente:</b> {evento.cliente.empresa}", styles['Normal']))
        story.append(Paragraph(f"<b>Data de Emissão:</b> {timezone.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))

        data = [["Item / Modelo", "Quantidade"]]
        for item in itens_do_reforco:
            data.append([item['modelo'], item['qtd']])

        table = Table(data, colWidths=[5.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.darkgrey),
            ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke), # <-- LINHA CORRIGIDA AQUI
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('ALIGN', (1,1), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold')
        ]))
        story.append(table)
        story.append(Spacer(1, 1*inch))

        assinaturas = [
            ["__________________________________", "__________________________________"],
            [Paragraph("Conferido por (Novalite)", styles['Normal']), Paragraph("Recebido por (Cliente/Produção)", styles['Normal'])]
        ]
        story.append(Table(assinaturas, colWidths=[3*inch, 3*inch], style=[('ALIGN', (0,0), (-1,-1), 'CENTER')]))

        doc.build(story)
        return response
    except Exception as e:
        return Response({'error': str(e)}, status=500)   


