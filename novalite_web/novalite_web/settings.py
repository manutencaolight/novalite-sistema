# C:\projeto_iluminacao\config\settings.py

import os
import dj_database_url  # <--- MUDANÇA: Importação adicionada

from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# --- MUDANÇA: SECRET_KEY agora é flexível ---
# Ele tenta ler a chave de uma variável de ambiente, se não encontrar, usa a chave de desenvolvimento.
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-sua-chave-antiga-pode-ficar-aqui')

# --- MUDANÇA: DEBUG agora é flexível ---
# Por padrão é True, mas se a variável de ambiente DEBUG for 'False', ele se torna False.
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# --- MUDANÇA: ALLOWED_HOSTS agora é flexível ---
# Começa vazio e adiciona o endereço do Render.com automaticamente se estiver na nuvem.
ALLOWED_HOSTS = ['novalite-sistema.onrender.com']
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)
    
# Adicione 'localhost' e '127.0.0.1' para permitir o acesso local
ALLOWED_HOSTS.append('127.0.0.1')
ALLOWED_HOSTS.append('localhost')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders', # <--- ADICIONE ESTA LINHA
    'core',  # <--- Altere 'orcamento' para 'core'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # <--- MUDANÇA: Adicionado Whitenoise
    'corsheaders.middleware.CorsMiddleware', # <--- ADICIONE ESTA LINHA
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'novalite_web.urls'  # <--- Altere 'config.urls' para o nome correto

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')], # Garante que o Django encontre sua pasta de templates
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# --- MUDANÇA: Configuração de Banco de Dados flexível ---
DATABASES = {
    'default': dj_database_url.config(
        # Se não encontrar a variável DATABASE_URL (online), usa o sqlite local como padrão.
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600 # Mantém as conexões ativas por mais tempo
    )
}


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = True


# --- MUDANÇA: Configuração de Arquivos Estáticos para produção ---
STATIC_URL = 'static/'
# Quando em produção, todos os arquivos estáticos serão coletados nesta pasta.
STATIC_ROOT = BASE_DIR / 'staticfiles'
# Habilita o armazenamento otimizado do Whitenoise.
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# No final do arquivo settings.py
CORS_ALLOWED_ORIGINS = [
    "https://sistemanovalite.onrender.com",
]
