from django.apps import AppConfig


class ClinicApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    def ready(self):
        import api.signals  # noqa
