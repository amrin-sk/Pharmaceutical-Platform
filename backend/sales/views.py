from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .models import Sale
from .serializers import SaleSerializer
from inventory.models import Medicine


class SaleView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # 🔥 latest sales first
        sales = Sale.objects.all().order_by('-date')
        serializer = SaleSerializer(sales, many=True)
        return Response(serializer.data)

    def post(self, request):
        medicine_id = request.data.get('medicine')
        quantity = request.data.get('quantity')

        # 🚨 Validate input
        if not medicine_id or quantity is None:
            return Response(
                {"error": "Medicine and quantity are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = int(quantity)
        except ValueError:
            return Response(
                {"error": "Quantity must be a number"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🚨 Prevent negative / zero sales
        if quantity <= 0:
            return Response(
                {"error": "Quantity must be greater than 0"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            medicine = Medicine.objects.get(id=medicine_id)
        except Medicine.DoesNotExist:
            return Response(
                {"error": "Medicine not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # 🚨 Stock check
        if quantity > medicine.quantity:
            return Response(
                {"error": "Not enough stock"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔥 Update stock
        medicine.quantity -= quantity
        medicine.save()

        # 🔥 Calculate price
        total_price = medicine.price * quantity

        from django.utils import timezone
        # 🔥 Create sale
        sale = Sale.objects.create(
            medicine=medicine,
            quantity=quantity,
            total_price=total_price
        )

        serializer = SaleSerializer(sale)
        return Response(serializer.data, status=status.HTTP_201_CREATED)