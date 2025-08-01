# Em: core/models.py (Versão Final Corrigida)

from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db.models import Sum

class Cliente(models.Model):
    empresa = models.CharField(max_length=255, verbose_name="Empresa")
    representante = models.CharField(max_length=255, verbose_name="Representante")
    endereco = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True, verbose_name="E-mail para Notificações")
    telefone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone/WhatsApp", help_text="Use o formato internacional (ex: +5521999998888)")
    telefone_representante = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone do Representante")
    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ['empresa']
    def __str__(self):
        return self.empresa

class Equipamento(models.Model):
    CATEGORIAS = (("Acessórios em Geral", "Acessórios em Geral"), ("Adaptadores", "Adaptadores"),("Consoles", "Consoles"), ("Efeitos", "Efeitos"), ("Estruturas", "Estruturas (Box Truss, Praticáveis)"),("Iluminação Convencional", "Iluminação Convencional"), ("LEDs", "LEDs"),("Moving Lights", "Moving Lights"), ("Prolongas e Chicotes", "Prolongas e Chicotes"),("Rack Dimmer", "Rack Dimmer"), ("Sonorização", "Sonorização"), ("Vídeo", "Vídeo (Painéis de LED, Projeções)"),("Outros", "Outros"))
    modelo = models.CharField(max_length=255)
    fabricante = models.CharField(max_length=255, blank=True, null=True)
    categoria = models.CharField(max_length=100, choices=CATEGORIAS, default="Acessórios em Geral")
    quantidade_estoque = models.IntegerField(default=0)
    quantidade_manutencao = models.IntegerField(default=0)
    peso = models.FloatField(default=0.0, blank=True, null=True)
    class Meta:
        verbose_name = "Equipamento"
        verbose_name_plural = "Equipamentos"
        ordering = ['modelo']
    def __str__(self): return self.modelo

class Consumivel(models.Model):
    CATEGORIAS = (
        ('FITAS', 'Fitas (Isolante, Crepe, Silver Tape)'),
        ('FIXADORES', 'Fixadores (Abraçadeiras, Hellerman)'),
        ('CONECTORES', 'Conectores e Adaptadores Descartáveis'),
        ('OUTROS', 'Outros Consumíveis'),
    )
    nome = models.CharField(max_length=255, unique=True, verbose_name="Nome do Consumível")
    categoria = models.CharField(max_length=100, choices=CATEGORIAS, default="OUTROS")
    unidade_medida = models.CharField(max_length=20, default="unidade", help_text="Ex: unidade, rolo, metro, caixa")
    quantidade_estoque = models.IntegerField(default=0, verbose_name="Quantidade em Estoque")
    class Meta:
        verbose_name = "Consumível"
        verbose_name_plural = "Consumíveis"
        ordering = ['nome']
    def __str__(self):
        return self.nome

class Funcionario(models.Model):
    TIPOS = (("funcionario", "Funcionário"), ("freelancer", "Freelancer"))
    nome = models.CharField(max_length=255, verbose_name="Nome Completo")
    funcao = models.CharField(max_length=100, blank=True, null=True)
    tipo = models.CharField(max_length=20, choices=TIPOS, default="funcionario")
    email = models.EmailField(max_length=254, blank=True, null=True, verbose_name="E-mail para Notificações")
    contato = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone/WhatsApp", help_text="Use o formato internacional (ex: +5521999998888)")
    class Meta:
        verbose_name = "Funcionário"
        verbose_name_plural = "Funcionários"
        ordering = ['nome']
    def __str__(self):
        return self.nome

class Veiculo(models.Model):
    STATUS = (("Disponível", "Disponível"), ("Em Viagem", "Em Viagem"), ("Em Manutenção", "Em Manutenção"))
    nome = models.CharField(max_length=100, verbose_name="Nome/Apelido")
    placa = models.CharField(max_length=10, unique=True)
    tipo = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS, default="Disponível")
    class Meta:
        verbose_name = "Veículo"
        verbose_name_plural = "Veículos"
        ordering = ['nome']
    def __str__(self): return f"{self.nome} - {self.placa}"

class Usuario(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrador'),
        ('planejamento', 'Planejamento'),
        ('logistica', 'Logística'),
        ('manutencao', 'Manutenção'),
    )
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='planejamento', 
        verbose_name="Nível de Acesso"
    )
    # --- CORREÇÃO: ADICIONADO PARA EVITAR CONFLITO COM O USER PADRÃO ---
    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name="usuario_groups",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="usuario_permissions",
        related_query_name="user",
    )

class Evento(models.Model):
    STATUS_CHOICES = (
        ('PLANEJAMENTO', 'Em Planejamento'),
        ('AGUARDANDO_CONFERENCIA', 'Aguardando Conferência'),
        ('AGUARDANDO_SAIDA', 'Aguardando Saída'),
        ('EM_ANDAMENTO', 'Em Andamento'),
        ('FINALIZADO', 'Finalizado'),
        ('CANCELADO', 'Cancelado'),
    )
    TIPO_EVENTO_CHOICES = (("PROPRIO", "Evento Próprio"), ("SUBLOCACAO", "Sublocação"), ("EMPRESTIMO", "Empréstimo"))
    OPCOES_ENERGIA = (("220V", "220V"), ("380V", "380V"), ("Bifásico", "Bifásico"), ("Trifásico", "Trifásico"), ("Não se aplica", "Não se aplica"))
    OPCOES_ACESSO = (("Fácil", "Fácil (ex: doca, acesso direto)"), ("Médio", "Médio (ex: escadas, corredores)"), ("Difícil", "Difícil (ex: restrito, içamento)"))
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PLANEJAMENTO', verbose_name="Status da Operação")
    tipo_evento = models.CharField(max_length=20, choices=TIPO_EVENTO_CHOICES, default="PROPRIO", verbose_name="Tipo de Operação")
    nome = models.CharField(max_length=255, verbose_name="Nome do Evento/Descrição", blank=True, null=True)
    local = models.CharField(max_length=255, blank=True, null=True)
    cliente = models.ForeignKey('Cliente', on_delete=models.CASCADE, verbose_name="Cliente/Empresa")
    responsavel_local_nome = models.CharField(max_length=255, blank=True, null=True, verbose_name="Nome do Responsável no Local")
    responsavel_local_contato = models.CharField(max_length=20, blank=True, null=True, verbose_name="Contato do Responsável")
    data_montagem = models.DateField(blank=True, null=True, verbose_name="Data de Montagem")
    data_evento = models.DateField(verbose_name="Data de Início/Saída")
    data_termino = models.DateField(blank=True, null=True, verbose_name="Data de Término/Retorno")
    modificado_em = models.DateTimeField(auto_now=True, verbose_name="Última Modificação")
    observacao_correcao = models.TextField(blank=True, null=True, verbose_name="Observação para Correção")
    tipo_energia = models.CharField(max_length=20, choices=OPCOES_ENERGIA, blank=True, null=True, verbose_name="Tipo de Energia Local")
    distancia_energia_metros = models.IntegerField(default=0, verbose_name="Distância do Ponto de Energia (metros)")
    ponto_acesso_veiculo = models.CharField(max_length=20, choices=OPCOES_ACESSO, blank=True, null=True, verbose_name="Acesso de Veículo/Carga")
    necessita_gerador = models.BooleanField(default=False, verbose_name="Necessita de Gerador?")
    observacoes_tecnicas = models.TextField(blank=True, null=True, verbose_name="Observações Técnicas Adicionais")
    motivo_cancelamento = models.TextField(blank=True, null=True, verbose_name="Motivo do Cancelamento")
    equipe = models.ManyToManyField('Funcionario', blank=True, related_name="eventos")
    veiculos = models.ManyToManyField('Veiculo', blank=True, related_name="eventos")
    criado_por = models.ForeignKey(
        'Usuario', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        verbose_name="Criado por",
        related_name="operacoes_criadas"
    )
    class Meta:
        verbose_name = "Operação"
        verbose_name_plural = "Operações (Eventos, Empréstimos, etc)"
        ordering = ['-data_evento']
    def __str__(self):
        return self.nome or f"{self.get_tipo_evento_display()} para {self.cliente.empresa}"
    
class FotoPreEvento(models.Model):
    evento = models.ForeignKey(Evento, related_name='fotos', on_delete=models.CASCADE)
    imagem = models.ImageField(upload_to='fotos_pre_evento/')
    descricao = models.CharField(max_length=255, blank=True)
    class Meta:
        verbose_name = "Foto do Pré-Evento"
        verbose_name_plural = "Fotos do Pré-Evento"

class MaterialEvento(models.Model):
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE)
    equipamento = models.ForeignKey(Equipamento, on_delete=models.CASCADE, null=True, blank=True)
    item_descricao = models.CharField(max_length=255, blank=True, null=True, verbose_name="Item de Consumo/Descrição")
    quantidade = models.IntegerField(verbose_name="Qtd. Planejada")
    quantidade_separada = models.IntegerField(default=0, verbose_name="Qtd. com Saída")
    conferido = models.BooleanField(default=False, verbose_name="Item Conferido")
    STATUS_SUPRIMENTO_CHOICES = (('OK', 'Estoque OK'), ('PENDENTE', 'Insuficiente - Pendente de Ação'), ('SUBLOCADO', 'Resolvido (Sublocação)'), ('EMPRESTIMO', 'Resolvido (Empréstimo)'), ('COMPRADO', 'Resolvido (Compra)'), ('SUBSTITUIDO', 'Resolvido (Substituição)'))
    status_suprimento = models.CharField(max_length=20, choices=STATUS_SUPRIMENTO_CHOICES, default='OK', verbose_name="Status do Suprimento")
    def save(self, *args, **kwargs):
        if self.status_suprimento in ['OK', 'PENDENTE']:
            if self.equipamento and self.quantidade > self.equipamento.quantidade_estoque: self.status_suprimento = 'PENDENTE'
            else: self.status_suprimento = 'OK'
        super().save(*args, **kwargs)
    @property
    def quantidade_retornada_ok(self):
        return self.itens_retornados.filter(condicao='OK').aggregate(total=Sum('quantidade'))['total'] or 0
    @property
    def quantidade_retornada_defeito(self):
        return self.itens_retornados.exclude(condicao='OK').aggregate(total=Sum('quantidade'))['total'] or 0
    class Meta:
        verbose_name = "Material do Evento"
        verbose_name_plural = "Materiais dos Eventos"
    def __str__(self):
        nome_item = self.equipamento.modelo if self.equipamento else self.item_descricao
        return f"{self.quantidade}x {nome_item} para {self.evento.nome}"

class ConsumivelEvento(models.Model):
    evento = models.ForeignKey(Evento, related_name='consumiveis_set', on_delete=models.CASCADE)
    consumivel = models.ForeignKey(Consumivel, on_delete=models.CASCADE)
    quantidade = models.IntegerField(verbose_name="Quantidade Planeada")
    conferido = models.BooleanField(default=False)
    class Meta:
        verbose_name = "Consumível do Evento"
        verbose_name_plural = "Consumíveis do Evento"
        unique_together = ('evento', 'consumivel')
    def __str__(self):
        return f"{self.quantidade}x {self.consumivel.nome} para {self.evento.nome}"

class ItemRetornado(models.Model):
    CONDICAO_CHOICES = (('OK', 'Bom Estado'), ('DEFEITO', 'Com Defeito'), ('QUEBRADO', 'Quebrado'), ('PERDIDO', 'Perdido/Sumiu'))
    material_evento = models.ForeignKey(MaterialEvento, related_name='itens_retornados', on_delete=models.CASCADE)
    quantidade = models.PositiveIntegerField()
    condicao = models.CharField(max_length=20, choices=CONDICAO_CHOICES, default='OK')
    observacao = models.TextField(blank=True, null=True, verbose_name="Observação (ex: lente trincada, cabo partido)")
    data_retorno = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.quantidade}x {self.material_evento.equipamento.modelo} retornado(s) como {self.get_condicao_display()}"

class RegistroManutencao(models.Model):
    STATUS_MANUTENCAO = (('AGUARDANDO_AVALIACAO', 'Aguardando Avaliação'), ('EM_REPARO', 'Em Reparo'), ('AGUARDANDO_PECAS', 'Aguardando Peças'), ('REPARADO', 'Reparado / Pronto para Estoque'))
    equipamento = models.ForeignKey(Equipamento, related_name='historico_manutencao', on_delete=models.CASCADE)
    item_retornado = models.OneToOneField(ItemRetornado, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_MANUTENCAO, default='AGUARDANDO_AVALIACAO')
    descricao_problema = models.TextField()
    solucao_aplicada = models.TextField(blank=True, null=True)
    data_entrada = models.DateTimeField(auto_now_add=True)
    data_saida = models.DateTimeField(null=True, blank=True)
    def __str__(self):
        return f"Manutenção para {self.equipamento.modelo} - {self.get_status_display()}"


class AditivoOperacao(models.Model):
    operacao_original = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name="aditivos")
    criado_por = models.ForeignKey('Usuario', on_delete=models.SET_NULL, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    descricao = models.TextField(verbose_name="Descrição do Aditivo")

    class Meta:
        verbose_name = "Aditivo de Operação"
        verbose_name_plural = "Aditivos de Operações"
        ordering = ['-data_criacao']

    def __str__(self):
        return f"Aditivo para {self.operacao_original.nome} em {self.data_criacao.strftime('%d/%m/%Y')}"

class MaterialAditivo(models.Model):
    aditivo = models.ForeignKey(AditivoOperacao, on_delete=models.CASCADE, related_name="materiais_aditivo")
    equipamento = models.ForeignKey(Equipamento, on_delete=models.CASCADE)
    quantidade = models.IntegerField()

    def __str__(self):
        return f"{self.quantidade}x {self.equipamento.modelo}"    
