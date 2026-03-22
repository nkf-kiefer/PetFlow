from django.urls import path, include
from django.http import JsonResponse
from django.views.generic.base import RedirectView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from api.views import (
    ClinicViewSet,
    TutorViewSet,
    PetViewSet,
    EmployeeViewSet,
    ServiceViewSet,
    ProductViewSet,
    ServiceProductViewSet,
    SchedulingViewSet,
    FinancialTransactionViewSet,
    StockMovementViewSet,
    FinancialRecordViewSet,
)

router = DefaultRouter()
router.register(r"clinics", ClinicViewSet)
router.register(r"tutors", TutorViewSet)
router.register(r"pets", PetViewSet)
router.register(r"employees", EmployeeViewSet)
router.register(r"services", ServiceViewSet)
router.register(r"products", ProductViewSet)
router.register(r"service-products", ServiceProductViewSet)
router.register(r"schedulings", SchedulingViewSet)
router.register(r"financial-transactions", FinancialTransactionViewSet)
router.register(r"stock-movements", StockMovementViewSet)
router.register(r"financial-records", FinancialRecordViewSet)

urlpatterns = [
    path("", RedirectView.as_view(url="/static/index.html", permanent=False)),
    path("health/", lambda request: JsonResponse({"status": "ok"}), name="healthcheck"),
    path("api/", include(router.urls)),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
