# Em: novalite_web/novalite_web/urls.py (VERSÃO SIMPLIFICADA E CORRETA)

from django.contrib import admin
from django.urls import path, include # Adicione 'include'
from django.conf import settings
from django.conf.urls.static import static
from core import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('admin/', admin.site.urls),

    # Esta linha agora carrega TODAS as URLs do arquivo core/urls.py
    # e adiciona o prefixo 'api/' a todas elas de uma só vez.
    path('api/', include('core.urls')), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
