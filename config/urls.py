# Em: novalite_web/urls.py (Versão Corrigida e Final)

from django.contrib import admin
from django.urls import path, include # --- 'include' ADICIONADO AQUI ---
from django.conf import settings
from django.conf.urls.static import static
from core import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('admin/', admin.site.urls),

    # --- LINHA CORRIGIDA ---
    # Esta linha agora "inclui" todas as rotas definidas no seu novo arquivo core/urls.py
    path('api/', include('core.urls')), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
