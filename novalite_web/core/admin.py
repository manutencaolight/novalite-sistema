# Em: core/admin.py (Versão Final com Exportação para todos os modelos)

from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.db import models
from import_export import resources, fields, widgets
from import_export.admin import ImportExportModelAdmin
from django.contrib.auth.admin import UserAdmin

from .models import (
    Cliente, Equipamento, Funcionario, Veiculo, Evento,
    MaterialEvento, FotoPreEvento, Usuario, ItemRetornado, Consumivel, ConsumivelEvento,
    RegistroManutencao
)


# --- Seção 1: Resources para Importação/Exportação ---

class EquipamentoResource(resources.ModelResource):
    class Meta:
        model = Equipamento
        import_id_fields = ('id',)
        fields = ('id', 'modelo', 'fabricante', 'categoria', 'quantidade_estoque', 'quantidade_manutencao', 'peso')
        skip_unchanged = True
        report_skipped = True
    def before_import_row(self, row, **kwargs):
        modelo = row.get('modelo')
        if modelo and not row.get('id'):
            if Equipamento.objects.filter(modelo__iexact=modelo).exists():
                kwargs['skip_row'] = True

class ClienteResource(resources.ModelResource):
    class Meta:
        model = Cliente
        fields = ('id', 'empresa', 'representante', 'endereco', 'email', 'telefone', 'telefone_representante')

class FuncionarioResource(resources.ModelResource):
    class Meta:
        model = Funcionario
        fields = ('id', 'nome', 'funcao', 'tipo', 'email', 'contato')

class VeiculoResource(resources.ModelResource):
    class Meta:
        model = Veiculo
        fields = ('id', 'nome', 'placa', 'tipo', 'status')

class EventoResource(resources.ModelResource):
    cliente = fields.Field(
        column_name='cliente',
        attribute='cliente',
        widget=widgets.ForeignKeyWidget(Cliente, 'empresa'))
    equipe = fields.Field(
        column_name='equipe',
        attribute='equipe',
        widget=widgets.ManyToManyWidget(Funcionario, field='nome', separator=', '))
    veiculos = fields.Field(
        column_name='veiculos',
        attribute='veiculos',
        widget=widgets.ManyToManyWidget(Veiculo, field='nome', separator=', '))
    class Meta:
        model = Evento
        fields = ('id', 'nome', 'status', 'tipo_evento', 'local', 'cliente', 'data_evento', 'data_termino', 'equipe', 'veiculos', 'criado_por__username')
        export_order = fields

# --- NOVO RESOURCE: Consumivel ---
class ConsumivelResource(resources.ModelResource):
    class Meta:
        model = Consumivel
        fields = ('id', 'nome', 'categoria', 'unidade_medida', 'quantidade_estoque')

# --- NOVO RESOURCE: RegistroManutencao ---
class RegistroManutencaoResource(resources.ModelResource):
    equipamento = fields.Field(
        column_name='equipamento',
        attribute='equipamento',
        widget=widgets.ForeignKeyWidget(Equipamento, 'modelo'))
    class Meta:
        model = RegistroManutencao
        fields = ('id', 'os_number', 'equipamento', 'status', 'descricao_problema', 'solucao_aplicada', 'data_entrada', 'data_saida')

# --- NOVO RESOURCE: Usuario ---
class UsuarioResource(resources.ModelResource):
    class Meta:
        model = Usuario
        # Excluímos campos sensíveis como a senha
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'role', 'is_staff', 'is_active', 'date_joined')


# --- Seção 2: Classes 'Inline' (Definidas antes de serem usadas) ---

class MaterialEventoInline(admin.TabularInline):
    model = MaterialEvento
    extra = 1
    fields = ('equipamento', 'quantidade')
    autocomplete_fields = ('equipamento',)

class FotoPreEventoInline(admin.TabularInline):
    model = FotoPreEvento
    extra = 1

class ConsumivelEventoInline(admin.TabularInline):
    model = ConsumivelEvento
    extra = 1
    autocomplete_fields = ('consumivel',)


# --- Seção 3: Model Admins ---

@admin.register(Cliente)
class ClienteAdmin(ImportExportModelAdmin):
    resource_classes = [ClienteResource]
    search_fields = ('empresa', 'representante')
    list_display = ('empresa', 'representante', 'telefone', 'email')

@admin.register(Equipamento)
class EquipamentoAdmin(ImportExportModelAdmin):
    resource_classes = [EquipamentoResource]
    search_fields = ('modelo', 'fabricante')
    list_display = ('modelo', 'fabricante', 'categoria', 'quantidade_estoque')
    list_filter = ('categoria',)

@admin.register(Funcionario)
class FuncionarioAdmin(ImportExportModelAdmin):
    resource_classes = [FuncionarioResource]
    search_fields = ('nome', 'funcao')
    list_display = ('nome', 'funcao', 'tipo', 'contato', 'email')
    list_filter = ('tipo',)

@admin.register(Veiculo)
class VeiculoAdmin(ImportExportModelAdmin):
    resource_classes = [VeiculoResource]
    search_fields = ('nome', 'placa')
    list_display = ('nome', 'placa', 'tipo', 'status')
    list_filter = ('status',)

@admin.register(Evento)
class EventoAdmin(ImportExportModelAdmin):
    resource_classes = [EventoResource]
    fieldsets = (
        ('Status e Tipo da Operação', {'fields': ('status', 'tipo_evento')}),
        ('Informações Principais', {'fields': ('nome', 'local', 'cliente', 'responsavel_local_nome', 'responsavel_local_contato')}),
        ('Datas', {'fields': ('data_montagem', 'data_evento', 'data_termino')}),
        ('Recursos Designados', {'fields': ('equipe', 'veiculos')}),
    )
    inlines = [MaterialEventoInline, FotoPreEventoInline, ConsumivelEventoInline]
    list_display = ('nome', 'tipo_evento', 'cliente', 'data_evento', 'status', 'acao_do_evento')
    list_filter = ('status', 'tipo_evento', 'data_evento')
    search_fields = ('nome', 'cliente__empresa', 'local')
    autocomplete_fields = ('cliente', 'equipe', 'veiculos')

    def acao_do_evento(self, obj):
        url = reverse('evento_report_pdf', args=[obj.pk])
        return format_html('<a href="{}" class="button imprimir-button-lista" target="_blank">Imprimir</a>', url)
    acao_do_evento.short_description = 'Relatório Completo'

@admin.register(Usuario)
class UsuarioAdmin(ImportExportModelAdmin, UserAdmin): # <-- ATUALIZADO
    resource_classes = [UsuarioResource]              # <-- ADICIONADO
    fieldsets = UserAdmin.fieldsets + (('Nível de Acesso Customizado', {'fields': ('role',)}),)
    add_fieldsets = UserAdmin.add_fieldsets + (('Nível de Acesso Customizado', {'fields': ('role',)}),)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'role')
    list_filter = UserAdmin.list_filter + ('role',)

@admin.register(Consumivel)
class ConsumivelAdmin(ImportExportModelAdmin): # <-- ATUALIZADO
    resource_classes = [ConsumivelResource]   # <-- ADICIONADO
    list_display = ('nome', 'categoria', 'quantidade_estoque', 'unidade_medida')
    search_fields = ('nome',)
    list_filter = ('categoria',)

@admin.register(RegistroManutencao)
class RegistroManutencaoAdmin(ImportExportModelAdmin): # <-- ATUALIZADO
    resource_classes = [RegistroManutencaoResource]  # <-- ADICIONADO
    list_display = ('os_number', 'equipamento', 'status', 'data_entrada', 'data_saida')
    list_filter = ('status', 'data_entrada')
    search_fields = ('os_number', 'equipamento__modelo', 'descricao_problema')
    readonly_fields = ('os_number', 'data_entrada', 'data_saida')

# --- NOVO ADMIN ADICIONADO ---
@admin.register(RegistroPonto)
class RegistroPontoAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'data_hora_entrada', 'data_hora_saida', 'duracao', 'status')
    list_filter = ('evento', 'funcionario', 'status', 'data_hora_entrada')
    search_fields = ('funcionario__nome', 'evento__nome')
    # Torna os campos não editáveis no admin, pois eles são controlados pelo app
    readonly_fields = ('evento', 'funcionario', 'data_hora_entrada', 'data_hora_saida', 'status')

    def has_add_permission(self, request):
        # Impede a criação de novos registros de ponto manualmente pelo admin
        return False    
