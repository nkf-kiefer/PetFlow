from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth.hashers import make_password, identify_hasher
from .models import (
    Clinic,
    Tutor,
    Pet,
    Employee,
    Service,
    Product,
    ServiceProduct,
    Scheduling,
    ScheduledService,
    FinancialTransaction,
    StockMovement,
    FinancialRecord,
)


class ClinicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinic
        fields = "__all__"


class TutorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tutor
        fields = "__all__"


class PetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pet
        fields = "__all__"


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = "__all__"
        extra_kwargs = {"password": {"write_only": True}}

    def _hash_password_if_needed(self, raw_password):
        if not raw_password:
            return raw_password
        try:
            identify_hasher(raw_password)
            return raw_password
        except Exception:
            return make_password(raw_password)

    def create(self, validated_data):
        validated_data["password"] = self._hash_password_if_needed(validated_data.get("password"))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "password" in validated_data:
            validated_data["password"] = self._hash_password_if_needed(
                validated_data.get("password")
            )
        return super().update(instance, validated_data)


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"


class ServiceProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceProduct
        fields = "__all__"


class ScheduledServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledService
        fields = "__all__"
        extra_kwargs = {"scheduling": {"read_only": True, "required": False}}


class FinancialTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialTransaction
        fields = "__all__"


class SchedulingSerializer(serializers.ModelSerializer):
    scheduled_services = ScheduledServiceSerializer(many=True, required=False)
    financial_transaction = FinancialTransactionSerializer(read_only=True)

    class Meta:
        model = Scheduling
        fields = "__all__"

    def validate(self, data):
        date_time = data.get("date_time")
        employee = data.get("employee") or (self.instance.employee if self.instance else None)
        scheduling_id = self.instance.id if self.instance else None

        if date_time and date_time < timezone.now():
            raise serializers.ValidationError("Data e hora devem ser no futuro.")

        # Validar conflito simples de horários para o profissional
        if date_time and employee:
            overlap = Scheduling.objects.filter(employee=employee, date_time=date_time)
            if scheduling_id:
                overlap = overlap.exclude(id=scheduling_id)
            if overlap.exists():
                raise serializers.ValidationError(
                    "Profissional já possui agendamento neste horário."
                )

        return data

    def create(self, validated_data):
        services_data = validated_data.pop("scheduled_services", [])
        scheduling = Scheduling.objects.create(**validated_data)

        for s in services_data:
            ScheduledService.objects.create(scheduling=scheduling, **s)

        # Simplicidade: sem geração automática de transações financeiras nesta etapa
        return scheduling

    def update(self, instance, validated_data):
        services_data = validated_data.pop("scheduled_services", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if services_data is not None:
            instance.scheduled_services.all().delete()
            for s in services_data:
                ScheduledService.objects.create(scheduling=instance, **s)

        return instance


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = "__all__"


class FinancialRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialRecord
        fields = "__all__"
