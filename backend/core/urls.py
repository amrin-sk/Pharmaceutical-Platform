from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/users/', include('users.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/suppliers/', include('suppliers.urls')),
    path('api/ml/', include('forecasting.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]