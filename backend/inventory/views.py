from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .models import Medicine
from .serializers import MedicineSerializer


# ✅ LIST + CREATE
class MedicineListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        medicines = Medicine.objects.all()
        serializer = MedicineSerializer(medicines, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MedicineSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


# ✅ DETAIL + UPDATE + DELETE
class MedicineDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return Medicine.objects.get(pk=pk)
        except Medicine.DoesNotExist:
            return None

    def get(self, request, pk):
        medicine = self.get_object(pk)
        if not medicine:
            return Response({"error": "Not found"}, status=404)

        serializer = MedicineSerializer(medicine)
        return Response(serializer.data)

    def put(self, request, pk):
        medicine = self.get_object(pk)
        if not medicine:
            return Response({"error": "Not found"}, status=404)

        serializer = MedicineSerializer(medicine, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        medicine = self.get_object(pk)
        if not medicine:
            return Response({"error": "Not found"}, status=404)

        medicine.delete()
        return Response({"message": "Deleted successfully"}, status=204)