import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from inventory.models import Medicine
from inventory.serializers import MedicineSerializer

try:
    m = Medicine.objects.all()
    s = MedicineSerializer(m, many=True)
    res = s.data
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
