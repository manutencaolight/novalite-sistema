# Em: novalite_web/urls.py

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

# 3. DEPOIS, regista todos os seus ViewSets
router.register(r'clientes', views.ClienteViewSet)
router.register(r'funcionarios', views.FuncionarioViewSet)
router.register(r'veiculos', views.VeiculoViewSet)
router.register(r'equipamentos', views.EquipamentoViewSet)
router.register(r'eventos', views.EventoViewSet)
router.register(r'materiais', views.MaterialEventoViewSet)
router.register(r'manutencao', views.RegistroManutencaoViewSet)
router.register(r'consumiveis', views.ConsumivelViewSet)
router.register(r'consumiveis-evento', views.ConsumivelEventoViewSet)



# Lista de todos os endereços da aplicação
urlpatterns = [
    path('', views.home_view, name='home'), # <-- ADICIONE ESTA LINHA
    path('admin/', admin.site.urls),
    
    # --- URLS DO ROUTER REGISTRADAS SOB O PREFIXO 'api/' ---
    path('api/', include(router.urls)),

    # --- ROTAS DE LOGIN E ATUALIZAÇÃO DE TOKEN CORRIGIDAS ---
    # A rota de login agora aponta para a nossa view customizada
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # A rota de refresh continua usando a view padrão
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
  
    # Endereços da API para funções específicas
    path('api/dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
    path('api/equipamentos/categorias/', views.get_equipment_categories, name='equipment-categories'),
    path('api/relatorio-avarias/', views.relatorio_de_avarias_recentes, name='relatorio_avarias'),

    # Endereços para geração de Relatórios em PDF
    path('reports/evento/<int:evento_id>/', views.evento_report_pdf, name='evento_report_pdf'),
    path('reports/guia-saida/<int:evento_id>/', views.gerar_guia_saida_pdf, name='gerar_guia_saida_pdf'),
    path('reports/avarias/<int:evento_id>/', views.gerar_relatorio_avarias_pdf, name='gerar_relatorio_avarias_pdf'),
    path('reports/evento/<int:evento_id>/guia-reforco/', views.gerar_guia_reforco_pdf, name='gerar_guia_reforco_pdf'),
]

# Configuração para servir arquivos de mídia em desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    
