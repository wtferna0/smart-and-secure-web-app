from rest_framework import mixins, viewsets
from .models import Payment
from .serializers import PaymentCreateSerializer

class PaymentViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    POST /api/payments/  -> create payment (marks order as PAID)
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentCreateSerializer
