# Em: core/serializers.py (Versão Final e Corrigida)

from rest_framework import serializers
from .models import (
    Cliente, Equipamento, Evento, Funcionario, Veiculo, 
    MaterialEvento, FotoPreEvento, ItemRetornado, RegistroManutencao, Usuario,
    Consumivel, ConsumivelEvento, AditivoOperacao, MaterialAditivo, 
    ConfirmacaoPresenca, HistoricoManutencao # --- MODELOS ATUALIZADOS ---
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

class EquipamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipamento
        fields = '__all__'

class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = ['id', 'nome', 'funcao', 'tipo', 'email', 'contato']

class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = '__all__'

class FotoPreEventoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoPreEvento
        fields = '__all__'        

class ConsumivelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consumivel
        fields = '__all__'

class ConsumivelEventoSerializer(serializers.ModelSerializer):
    consumivel = ConsumivelSerializer(read_only=True)
    consumivel_id = serializers.PrimaryKeyRelatedField(
        queryset=Consumivel.objects.all(), source='consumivel', write_only=True
    )
    class Meta:
        model = ConsumivelEvento
        fields = ['id', 'evento', 'consumivel', 'consumivel_id', 'quantidade', 'conferido']

class MaterialEventoNestedSerializer(serializers.ModelSerializer):
    equipamento = EquipamentoSerializer(read_only=True)
    class Meta:
        model = MaterialEvento
        fields = ['id', 'equipamento', 'item_descricao']

class ItemRetornadoSerializer(serializers.ModelSerializer):
    material_evento = MaterialEventoNestedSerializer(read_only=True)
    condicao_display = serializers.CharField(source='get_condicao_display', read_only=True)
    class Meta:
        model = ItemRetornado
        fields = [
            'id', 'material_evento', 'quantidade', 'condicao', 
            'observacao', 'data_retorno', 'condicao_display'
        ]

class MaterialEventoSerializer(serializers.ModelSerializer):
    equipamento = EquipamentoSerializer(read_only=True)
    equipamento_id = serializers.PrimaryKeyRelatedField(
        queryset=Equipamento.objects.all(), source='equipamento', write_only=True, required=False, allow_null=True
    )
    itens_retornados = ItemRetornadoSerializer(many=True, read_only=True)
    quantidade_retornada_ok = serializers.IntegerField(read_only=True)
    quantidade_retornada_defeito = serializers.IntegerField(read_only=True)

    class Meta:
        model = MaterialEvento
        fields = [
            'id', 'evento', 'equipamento', 'equipamento_id', 'item_descricao', 'quantidade',
            'quantidade_separada', 'conferido', 
            'quantidade_retornada_ok', 'quantidade_retornada_defeito',
            'itens_retornados'
        ]

class EventoParaAvariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evento
        fields = ['id', 'nome']

class ItemRetornadoComEventoSerializer(ItemRetornadoSerializer):
    evento = EventoParaAvariaSerializer(source='material_evento.evento', read_only=True)
    class Meta(ItemRetornadoSerializer.Meta):
        fields = ItemRetornadoSerializer.Meta.fields + ['evento']

class UsuarioSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username']

# --- NOVO SERIALIZER PARA O HISTÓRICO DETALHADO ---
class HistoricoManutencaoSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True, default='Sistema')
    class Meta:
        model = HistoricoManutencao
        fields = ['id', 'data_atualizacao', 'status_anterior', 'status_novo', 'observacao', 'usuario_nome']

# --- NOVO SERIALIZER PARA A CONFIRMAÇÃO DE PRESENÇA ---
class ConfirmacaoPresencaSerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.CharField(source='funcionario.nome', read_only=True)
    presenca_confirmada = serializers.BooleanField(read_only=True)
    class Meta:
        model = ConfirmacaoPresenca
        fields = ['id', 'evento', 'funcionario', 'funcionario_nome', 
                  'confirmado_pelo_lider', 'confirmado_pelo_membro', 
                  'data_confirmacao_lider', 'data_confirmacao_membro', 'presenca_confirmada']

class EventoSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer(read_only=True)
    equipe = FuncionarioSerializer(many=True, read_only=True)
    veiculos = VeiculoSerializer(many=True, read_only=True)
    materialevento_set = MaterialEventoSerializer(many=True, read_only=True)
    consumiveis_set = ConsumivelEventoSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    criado_por = UsuarioSimpleSerializer(read_only=True)
    tem_avarias = serializers.SerializerMethodField()
    chefe_de_equipe = FuncionarioSerializer(read_only=True)
    confirmacoes_presenca = ConfirmacaoPresencaSerializer(many=True, read_only=True)
    
    cliente_id = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(), source='cliente', write_only=True, required=True
    )
    class Meta:
        model = Evento
        fields = [
            'id', 'status', 'status_display', 'tipo_evento', 'nome', 'local', 
            'cliente', 'cliente_id', 'responsavel_local_nome', 'responsavel_local_contato', 
            'data_montagem', 'data_evento', 'data_termino', 'modificado_em', 
            'observacao_correcao', 'motivo_cancelamento', 'equipe', 'veiculos', 
            'chefe_de_equipe', 'confirmacoes_presenca',
            'materialevento_set', 'consumiveis_set', 'criado_por', 'tem_avarias'
        ]

    def get_tem_avarias(self, obj):
        return ItemRetornado.objects.filter(material_evento__evento=obj).exclude(condicao='OK').exists()

class RegistroManutencaoSerializer(serializers.ModelSerializer):
    equipamento = EquipamentoSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    historico_detalhado = HistoricoManutencaoSerializer(many=True, read_only=True)
    class Meta:
        model = RegistroManutencao
        fields = ['id', 'os_number', 'equipamento', 'status', 'status_display',
                  'descricao_problema', 'solucao_aplicada', 'data_entrada',
                  'data_saida', 'historico_detalhado']

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'role']     

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        return token

class MaterialAditivoSerializer(serializers.ModelSerializer):
    equipamento = EquipamentoSerializer(read_only=True)
    equipamento_id = serializers.PrimaryKeyRelatedField(
        queryset=Equipamento.objects.all(), source='equipamento', write_only=True
    )
    class Meta:
        model = MaterialAditivo
        fields = ['id', 'equipamento', 'equipamento_id', 'quantidade']

class AditivoOperacaoSerializer(serializers.ModelSerializer):
    materiais_aditivo = MaterialAditivoSerializer(many=True)
    criado_por = UsuarioSimpleSerializer(read_only=True)

    class Meta:
        model = AditivoOperacao
        fields = ['id', 'operacao_original', 'criado_por', 'data_criacao', 'descricao', 'materiais_aditivo']
        read_only_fields = ['criado_por']

    def create(self, validated_data):
        materiais_data = validated_data.pop('materiais_aditivo')
        aditivo = AditivoOperacao.objects.create(**validated_data)
        for material_data in materiais_data:
            MaterialAditivo.objects.create(aditivo=aditivo, **material_data)
        return aditivo

# --- REMOVIDO O 'RegistroPontoSerializer' ---
