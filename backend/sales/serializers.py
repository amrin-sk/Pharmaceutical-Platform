from rest_framework import serializers
from .models import Sale

class SaleSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)

    class Meta:
        model = Sale
        fields = ['id', 'medicine', 'medicine_name', 'quantity', 'total_price', 'date']