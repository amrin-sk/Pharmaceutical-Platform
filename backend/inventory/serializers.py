from rest_framework import serializers
from .models import Medicine

class MedicineSerializer(serializers.ModelSerializer):
   supplier_name = serializers.CharField(source='supplier.name',read_only=True)
   
   class Meta:
        model = Medicine
        fields = '__all__'