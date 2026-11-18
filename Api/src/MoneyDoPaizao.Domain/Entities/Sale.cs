using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class Sale
{
    private Sale()
    {
    }

    private Sale(Guid accountId, Guid customerId, Guid productId, SalePaymentType paymentType, decimal amount, DateTime? dueDate)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        CustomerId = customerId;
        ProductId = productId;
        PaymentType = paymentType;
        Amount = amount;
        DueDate = dueDate?.Date;
        Status = paymentType == SalePaymentType.Cash ? SaleStatus.Paid : SaleStatus.Pending;
        PaidAtUtc = Status == SaleStatus.Paid ? DateTime.UtcNow : null;
        SoldAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public Guid CustomerId { get; private set; }
    public Customer? Customer { get; private set; }
    public Guid ProductId { get; private set; }
    public Product? Product { get; private set; }
    public SalePaymentType PaymentType { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime? DueDate { get; private set; }
    public SaleStatus Status { get; private set; }
    public DateTime SoldAtUtc { get; private set; }
    public DateTime? PaidAtUtc { get; private set; }

    public static Sale Create(Guid accountId, Guid customerId, Guid productId, SalePaymentType paymentType, decimal amount, DateTime? dueDate)
        => new(accountId, customerId, productId, paymentType, amount, dueDate);

    public void MarkAsPaid()
    {
        Status = SaleStatus.Paid;
        PaidAtUtc = DateTime.UtcNow;
    }
}
