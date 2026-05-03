from rest_framework.decorators import api_view
from rest_framework.response import Response
from inventory.models import Medicine
from sales.models import Sale
from django.db.models import Sum
from datetime import date
@api_view(['GET'])
def get_dashboard(request):
    total_medicines = Medicine.objects.aggregate(total=Sum('quantity'))['total'] or 0

    low_stock = Medicine.objects.filter(quantity__lt=20).count()

    today_sales = Sale.objects.filter(date__gte=date.today()).count()

    total_revenue = Sale.objects.aggregate(
        total=Sum('total_price')
    )['total'] or 0

    return Response({
        "total_medicines": total_medicines,
        "low_stock_count": low_stock,
        "today_sales": today_sales,
        "total_revenue": total_revenue
    })

