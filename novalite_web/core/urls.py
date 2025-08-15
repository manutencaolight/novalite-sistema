# Em: core/urls.py (Versão com a rota corrigida)

from django.urls import path
from rest_framework import routers
from . import views
from .views import MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

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

urlpatterns = [
    *router.urls,
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
    path('inventario/lista-categorias/', views.get_equipment_categories, name='equipment-categories'),
    path('relatorio-avarias/', views.relatorio_de_avarias_recentes, name='relatorio_avarias'),
    path('reports/evento/<int:evento_id>/', views.evento_report_pdf, name='evento_report_pdf'),
    path('reports/guia-saida/<int:evento_id>/', views.gerar_guia_saida_pdf, name='gerar_guia_saida_pdf'),
    path('reports/avarias/<int:evento_id>/', views.gerar_relatorio_avarias_pdf, name='gerar_relatorio_avarias_pdf'),
    
    # --- ROTA CORRIGIDA CONFORME SUA SOLICITAÇÃO ---
    path('ponto/meus-dados/', views.MeusEventosView.as_view(), name='meus-eventos'),
    
    path('reports/evento/<int:evento_id>/guia-reforco/', views.gerar_guia_reforco_pdf, name='gerar_guia_reforco_pdf'),
]
