from django.db import models
from suppliers.models import Supplier

class Medicine(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100, default='General')
    quantity = models.IntegerField()
    expiry_date = models.DateField()
    price = models.FloatField()

    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    def __str__(self):
        return self.name