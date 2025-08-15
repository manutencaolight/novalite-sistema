#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

echo "--- TENTANDO CRIAR/ATUALIZAR SUPERUSUARIO ---"
python manage.py createsuperuser --noinput || echo "Superusuário já existe, ignorando erro."
echo "--- SUPERUSUARIO PROCESSADO ---"