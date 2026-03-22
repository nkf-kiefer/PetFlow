from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import StockMovement, Product


@receiver(post_save, sender=Product)
def handle_product_creation(sender, instance, created, **kwargs):
    """Quando um produto é criado com quantity > 0, registra a entrada inicial no estoque."""
    if created and instance.quantity > 0:
        initial_qty = instance.quantity
        # Zera no objeto Python e no banco antes de criar o StockMovement,
        # pois handle_stock_movement irá somar. Sem isso a quantidade duplica.
        instance.quantity = 0
        Product.objects.filter(pk=instance.pk).update(quantity=0)
        StockMovement.objects.create(
            clinic=instance.clinic,
            product=instance,
            movement_type="entrada",
            quantity=initial_qty,
            description="Quantidade inicial ao cadastrar produto",
            employee=None,
            notes=f"Cadastro automático do produto {instance.name}",
        )


@receiver(post_save, sender=StockMovement)
def handle_stock_movement(sender, instance, created, **kwargs):
    """Quando há movimento de estoque, atualiza a quantidade do produto."""
    if created:
        if instance.movement_type == "entrada":
            instance.product.quantity += instance.quantity
        elif instance.movement_type == "saida":
            instance.product.quantity = max(0, instance.product.quantity - instance.quantity)
        elif instance.movement_type == "devolucao":
            instance.product.quantity += instance.quantity
        elif instance.movement_type == "ajuste":
            instance.product.quantity = instance.quantity

        instance.product.save()
