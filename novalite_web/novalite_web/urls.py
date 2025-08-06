# FORÇANDO A ATUALIZAÇÃO FINAL - v2

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers # 1. Importa a biblioteca de routers
from core import views
from core.views import MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

# 2. Cria a instância do router PRIMEIRO
router = routers.DefaultRouter()
router.register(r'clientes', views.ClienteViewSet)
router.register(r'funcionarios', views.FuncionarioViewSet)
router.register(r'veiculos', views.VeiculoViewSet)
router.register(r'equipamentos', views.EquipamentoViewSet)
router.register(r'eventos', views.EventoViewSet)
router.register(r'aditivos', views.AditivoOperacaoViewSet)
router.register(r'materiais', views.MaterialEventoViewSet)
router.register(r'manutencao', views.RegistroManutencaoViewSet, basename='manutencao')
router.register(r'manutencao-historico', views.RegistroManutencaoHistoryViewSet, basename='manutencao-historico')
router.register(r'consumiveis', views.ConsumivelViewSet)
router.register(r'consumiveis-evento', views.ConsumivelEventoViewSet)

# Lista de todos os endereços da aplicação
urlpatterns = [
    path('', views.home_view, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
    path('api/equipamentos/categorias/', views.get_equipment_categories, name='equipment-categories'),
        # ADICIONE ESTA NOVA LINHA
    path('api/test-deploy/', views.test_view, name='test-deploy'),

    path('api/relatorio-avarias/', views.relatorio_de_avarias_recentes, name='relatorio_avarias'),
    path('api/reports/evento/<int:evento_id>/', views.evento_report_pdf, name='evento_report_pdf'),
    path('api/reports/guia-saida/<int:evento_id>/', views.gerar_guia_saida_pdf, name='gerar_guia_saida_pdf'),
    path('api/reports/avarias/<int:evento_id>/', views.gerar_relatorio_avarias_pdf, name='gerar_relatorio_avarias_pdf'),
    path('api/reports/evento/<int:evento_id>/guia-reforco/', views.gerar_guia_reforco_pdf, name='gerar_guia_reforco_pdf'),
]
# Configuração para servir arquivos de mídia em desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    
