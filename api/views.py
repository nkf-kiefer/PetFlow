from rest_framework import viewsets, permissions
from .models import (
    Clinic,
    Tutor,
    Pet,
    Employee,
    Service,
    Product,
    ServiceProduct,
    Scheduling,
    FinancialTransaction,
    StockMovement,
    FinancialRecord,
)
from .serializers import (
    ClinicSerializer,
    TutorSerializer,
    PetSerializer,
    EmployeeSerializer,
    ServiceSerializer,
    ProductSerializer,
    ServiceProductSerializer,
    SchedulingSerializer,
    FinancialTransactionSerializer,
    StockMovementSerializer,
    FinancialRecordSerializer,
)


class AuthReadWritePermission(permissions.IsAuthenticatedOrReadOnly):
    """GET: público, outros métodos: JWT autenticado."""

    pass


class ClinicViewSet(viewsets.ModelViewSet):
    queryset = Clinic.objects.all()
    serializer_class = ClinicSerializer
    permission_classes = [AuthReadWritePermission]


class TutorViewSet(viewsets.ModelViewSet):
    queryset = Tutor.objects.all()
    serializer_class = TutorSerializer
    permission_classes = [AuthReadWritePermission]


class PetViewSet(viewsets.ModelViewSet):
    queryset = Pet.objects.all()
    serializer_class = PetSerializer
    permission_classes = [AuthReadWritePermission]


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [AuthReadWritePermission]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    permission_classes = [AuthReadWritePermission]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AuthReadWritePermission]


class ServiceProductViewSet(viewsets.ModelViewSet):
    queryset = ServiceProduct.objects.all()
    serializer_class = ServiceProductSerializer
    permission_classes = [AuthReadWritePermission]


class FinancialTransactionViewSet(viewsets.ModelViewSet):
    queryset = FinancialTransaction.objects.all()
    serializer_class = FinancialTransactionSerializer
    permission_classes = [AuthReadWritePermission]


class SchedulingViewSet(viewsets.ModelViewSet):
    queryset = Scheduling.objects.all()
    serializer_class = SchedulingSerializer
    permission_classes = [AuthReadWritePermission]


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [AuthReadWritePermission]


class FinancialRecordViewSet(viewsets.ModelViewSet):
    queryset = FinancialRecord.objects.all()
    serializer_class = FinancialRecordSerializer
    permission_classes = [AuthReadWritePermission]
