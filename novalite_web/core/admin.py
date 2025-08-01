# Em: core/admin.py (Versão Reordenada)

from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.db import models
from import_export import resources
from import_export.admin import ImportExportModelAdmin
from django.contrib.auth.admin import UserAdmin

from .models import (
    Cliente, Equipamento, Funcionario, Veiculo, Evento,
    MaterialEvento, FotoPreEvento, Usuario, ItemRetornado, Consumivel, ConsumivelEvento
)

# --- Resources e Admins Básicos ---
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

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    search_fields = ('empresa', 'representante')
    list_display = ('empresa', 'representante', 'telefone', 'email')

@admin.register(Equipamento)
class EquipamentoAdmin(ImportExportModelAdmin):
    resource_classes = [EquipamentoResource]
    search_fields = ('modelo', 'fabricante')
    list_display = ('modelo', 'fabricante', 'categoria', 'quantidade_estoque')
    list_filter = ('categoria',)

@admin.register(Funcionario)
class FuncionarioAdmin(admin.ModelAdmin):
    search_fields = ('nome', 'funcao')
    list_display = ('nome', 'funcao', 'tipo', 'contato', 'email')
    list_filter = ('tipo',)

@admin.register(Veiculo)
class VeiculoAdmin(admin.ModelAdmin):
    search_fields = ('nome', 'placa')
    list_display = ('nome', 'placa', 'tipo', 'status')
    list_filter = ('status',)    

# --- Classes 'Inline' (Devem ser definidas ANTES de serem usadas) ---

class MaterialEventoInline(admin.TabularInline):
    model = MaterialEvento
    extra = 1
    fields = ('equipamento', 'quantidade')
    autocomplete_fields = ('equipamento',)
    formfield_overrides = {
        models.IntegerField: {'widget': admin.widgets.AdminTextInputWidget(attrs={'style': 'width: 60px; text-align: center;'})},
    }

class FotoPreEventoInline(admin.TabularInline):
    model = FotoPreEvento
    extra = 1

# --- CORREÇÃO: CLASSE MOVIDA PARA CIMA ---
class ConsumivelEventoInline(admin.TabularInline):
    model = ConsumivelEvento
    extra = 1
    autocomplete_fields = ('consumivel',)    

# --- Admin Principal do Evento (Usa as classes 'Inline' acima) ---

@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Status e Tipo da Operação', {'fields': ('status', 'tipo_evento')}),
        ('Informações Principais', {'fields': ('nome', 'local', 'cliente', 'responsavel_local_nome', 'responsavel_local_contato')}),
        ('Datas', {'fields': ('data_montagem', 'data_evento', 'data_termino')}),
        ('Recursos Designados', {'fields': ('equipe', 'veiculos')}),
    )
    # Agora o Python já conhece todas estas classes 'Inline'
    inlines = [MaterialEventoInline, FotoPreEventoInline, ConsumivelEventoInline]
    list_display = ('nome', 'tipo_evento', 'cliente', 'data_evento', 'status', 'acao_do_evento')
    list_filter = ('status', 'tipo_evento', 'data_evento')
    search_fields = ('nome', 'cliente__empresa', 'local')
    autocomplete_fields = ('cliente', 'equipe', 'veiculos')
    class Media:
        css = {'all': ('core/css/admin_extra.css',)}
    def acao_do_evento(self, obj):
        url = reverse('evento_report_pdf', args=[obj.pk])
        return format_html('<a href="{}" class="button imprimir-button-lista" target="_blank">Imprimir</a>', url)
    acao_do_evento.short_description = 'Relatório Completo'

# --- Outros Admins ---

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Nível de Acesso Customizado', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Nível de Acesso Customizado', {'fields': ('role',)}),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'role')
    list_filter = UserAdmin.list_filter + ('role',)

@admin.register(Consumivel)
class ConsumivelAdmin(admin.ModelAdmin):
    list_display = ('nome', 'categoria', 'quantidade_estoque', 'unidade_medida')
    search_fields = ('nome',)
    list_filter = ('categoria',)