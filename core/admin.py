# Em: core/admin.py (Versão com correção no EventoResource)

from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from import_export import resources, fields, widgets
from import_export.admin import ImportExportModelAdmin
from django.contrib.auth.admin import UserAdmin

from .models import (
    Cliente, Equipamento, Funcionario, Veiculo, Evento,
    MaterialEvento, FotoPreEvento, Usuario, ItemRetornado, Consumivel, ConsumivelEvento,
    RegistroManutencao, ConfirmacaoPresenca, HistoricoManutencao,
    EscalaFuncionario
)

# --- Seção 1: Resources para Importação/Exportação ---

class EquipamentoResource(resources.ModelResource):
    class Meta:
        model = Equipamento
        fields = ('id', 'modelo', 'fabricante', 'categoria', 'quantidade_estoque', 'quantidade_manutencao', 'peso')

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
    cliente = fields.Field(attribute='cliente', widget=widgets.ForeignKeyWidget(Cliente, 'empresa'))
    chefe_de_equipe = fields.Field(attribute='chefe_de_equipe', widget=widgets.ForeignKeyWidget(Funcionario, 'nome'))
    veiculos = fields.Field(attribute='veiculos', widget=widgets.ManyToManyWidget(Veiculo, field='nome', separator=', '))
    # Novo campo customizado para exportar a equipe
    equipe_escalada = fields.Field(column_name='Equipe Escalada')

    class Meta:
        model = Evento
        # O campo 'equipe' foi removido e substituído por 'equipe_escalada'
        fields = ('id', 'nome', 'status', 'tipo_evento', 'local', 'cliente', 'data_evento', 'data_termino', 'chefe_de_equipe', 'veiculos', 'criado_por__username', 'equipe_escalada')
        export_order = fields

    # Função que popula o campo 'equipe_escalada' no arquivo exportado
    def dehydrate_equipe_escalada(self, evento):
        nomes = [escala.funcionario.nome for escala in evento.escala_equipe.all()]
        return ", ".join(nomes)

class ConsumivelResource(resources.ModelResource):
    class Meta:
        model = Consumivel
        fields = ('id', 'nome', 'categoria', 'unidade_medida', 'quantidade_estoque')

class RegistroManutencaoResource(resources.ModelResource):
    equipamento = fields.Field(attribute='equipamento', widget=widgets.ForeignKeyWidget(Equipamento, 'modelo'))
    class Meta:
        model = RegistroManutencao
        fields = ('id', 'os_number', 'equipamento', 'status', 'descricao_problema', 'solucao_aplicada', 'data_entrada', 'data_saida')

class UsuarioResource(resources.ModelResource):
    class Meta:
        model = Usuario
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

class EscalaFuncionarioInline(admin.TabularInline):
    model = EscalaFuncionario
    extra = 1
    autocomplete_fields = ('funcionario',)
    verbose_name = "Membro da Equipe na Escala"
    verbose_name_plural = "Equipe Escalada"


# --- Seção 3: Model Admins ---

@admin.register(Cliente)
class ClienteAdmin(ImportExportModelAdmin):
    resource_classes = [ClienteResource]
    search_fields = ('empresa', 'representante')
    list_display = ('empresa', 'representante', 'telefone', 'email')

@admin.register(Equipamento)
class EquipamentoAdmin(ImportExportModelAdmin):
    resource_classes = [EquipamentoResource]
    search_fields = ('modelo', 'fabricante') # <<< CORREÇÃO ADICIONADA
    list_display = ('modelo', 'fabricante', 'categoria', 'quantidade_estoque')
    list_filter = ('categoria',)

@admin.register(Funcionario)
class FuncionarioAdmin(ImportExportModelAdmin):
    resource_classes = [FuncionarioResource]
    search_fields = ('nome', 'funcao') # <<< CORREÇÃO ADICIONADA
    list_display = ('nome', 'funcao', 'tipo', 'contato', 'email')
    list_filter = ('tipo',)

@admin.register(Veiculo)
class VeiculoAdmin(ImportExportModelAdmin):
    resource_classes = [VeiculoResource]
    search_fields = ('nome', 'placa') # <<< CORREÇÃO ADICIONADA
    list_display = ('nome', 'placa', 'tipo', 'status')
    list_filter = ('status',)

@admin.register(Evento)
class EventoAdmin(ImportExportModelAdmin):
    resource_classes = [EventoResource]
    fieldsets = (
        ('Status e Tipo da Operação', {'fields': ('status', 'tipo_evento')}),
        ('Informações Principais', {'fields': ('nome', 'local', 'cliente', 'responsavel_local_nome', 'responsavel_local_contato')}),
        ('Datas', {'fields': ('data_montagem', 'data_evento', 'data_termino')}),
        ('Recursos Designados', {'fields': ('veiculos', 'chefe_de_equipe')}),
    )
    inlines = [EscalaFuncionarioInline, MaterialEventoInline, FotoPreEventoInline, ConsumivelEventoInline]
    list_display = ('nome', 'tipo_evento', 'cliente', 'data_evento', 'status', 'acao_do_evento')
    list_filter = ('status', 'tipo_evento', 'data_evento')
    search_fields = ('nome', 'cliente__empresa', 'local')
    autocomplete_fields = ('cliente', 'veiculos', 'chefe_de_equipe')

    def acao_do_evento(self, obj):
        url = reverse('evento_report_pdf', args=[obj.pk])
        return format_html('<a href="{}" class="button imprimir-button-lista" target="_blank">Imprimir</a>', url)
    acao_do_evento.short_description = 'Relatório Completo'

@admin.register(Usuario)
class UsuarioAdmin(ImportExportModelAdmin, UserAdmin):
    resource_classes = [UsuarioResource]
    fieldsets = UserAdmin.fieldsets + (('Nível de Acesso Customizado', {'fields': ('role',)}),)
    add_fieldsets = UserAdmin.add_fieldsets + (('Nível de Acesso Customizado', {'fields': ('role',)}),)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'role')
    list_filter = UserAdmin.list_filter + ('role',)

@admin.register(Consumivel)
class ConsumivelAdmin(ImportExportModelAdmin):
    resource_classes = [ConsumivelResource]
    search_fields = ('nome',) # <<< CORREÇÃO ADICIONADA
    list_display = ('nome', 'categoria', 'quantidade_estoque', 'unidade_medida')
    list_filter = ('categoria',)

@admin.register(RegistroManutencao)
class RegistroManutencaoAdmin(ImportExportModelAdmin):
    # resource_classes = [RegistroManutencaoResource] # (Descomente se precisar de exportação)
    list_display = ('os_number', 'equipamento', 'status', 'data_entrada', 'data_saida')
    list_filter = ('status', 'data_entrada')
    search_fields = ('os_number', 'equipamento__modelo', 'descricao_problema')
    readonly_fields = ('os_number', 'data_entrada', 'data_saida')

@admin.register(ConfirmacaoPresenca)
class ConfirmacaoPresencaAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'confirmado_pelo_lider', 'confirmado_pelo_membro', 'presenca_confirmada')
    list_filter = ('evento', 'funcionario', 'confirmado_pelo_lider', 'confirmado_pelo_membro')
    search_fields = ('funcionario__nome', 'evento__nome')
    readonly_fields = ('evento', 'funcionario', 'confirmado_pelo_lider', 'confirmado_pelo_membro', 
                       'data_confirmacao_lider', 'data_confirmacao_membro')

    def has_add_permission(self, request):
        return False
