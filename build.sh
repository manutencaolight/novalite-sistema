#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

echo "--- TENTANDO CRIAR/ATUALIZAR SUPERUSUARIO ---"
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); u, _ = User.objects.get_or_create(username='leonardo'); u.set_password('@Leo271984'); u.is_superuser = True; u.is_staff = True; u.save()"
echo "--- SUPERUSUARIO PROCESSADO ---"--"