# Em: novalite_web/urls.py (Versão Corrigida)

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from core import views
from core.views import MyTokenObtainPairView
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
    path('', views.home_view, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    path('api/debug-urls/', views.list_all_urls, name='debug-urls'),

    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
    path('api/inventario/lista-categorias/', views.get_equipment_categories, name='equipment-categories'),
    path('api/relatorio-avarias/', views.relatorio_de_avarias_recentes, name='relatorio_avarias'),
    path('api/reports/evento/<int:evento_id>/', views.evento_report_pdf, name='evento_report_pdf'),
    path('api/reports/guia-saida/<int:evento_id>/', views.gerar_guia_saida_pdf, name='gerar_guia_saida_pdf'),
    path('api/reports/avarias/<int:evento_id>/', views.gerar_relatorio_avarias_pdf, name='gerar_relatorio_avarias_pdf'),
    path('api/meus-eventos/', views.MeusEventosView.as_view(), name='meus-eventos'),
    path('api/reports/evento/<int:evento_id>/guia-reforco/', views.gerar_guia_reforco_pdf, name='gerar_guia_reforco_pdf'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
