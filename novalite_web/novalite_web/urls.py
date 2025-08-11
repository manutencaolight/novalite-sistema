# Em: novalite_web/urls.py (VERSÃO SIMPLIFICADA)

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('admin/', admin.site.urls),

    # AQUI está a mágica:
    # Todas as URLs do arquivo core/urls.py serão incluídas sob o prefixo 'api/'
    path('api/', include('core.urls')), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
