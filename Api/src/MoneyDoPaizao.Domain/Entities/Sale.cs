using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class Sale
{
    private Sale()
    {
    }

    private Sale(Guid accountId, Guid customerId, Guid productId, SalePaymentType paymentType, decimal unitPrice)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        CustomerId = customerId;
        ProductId = productId;
        PaymentType = paymentType;
        UnitPrice = unitPrice;
        Amount = unitPrice;
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
    public decimal? UnitPrice { get; private set; }
    public decimal? DownPaymentAmount { get; private set; }
    public int? InstallmentCount { get; private set; }
    public decimal? InstallmentAmount { get; private set; }
    public decimal? LastInstallmentAmount { get; private set; }
    public DateTime? DueDate { get; private set; }
    public SaleStatus Status { get; private set; }
    public DateTime SoldAtUtc { get; private set; }
    public DateTime? PaidAtUtc { get; private set; }

    public static Sale CreateCash(Guid accountId, Guid customerId, Guid productId, decimal unitPrice)
        => new(accountId, customerId, productId, SalePaymentType.Cash, unitPrice);

    public static Sale CreateInstallment(Guid accountId, Guid customerId, Guid productId, decimal unitPrice,
        decimal downPaymentAmount, int installmentCount, decimal installmentAmount, decimal? lastInstallmentAmount, DateTime? dueDate)
        => new(accountId, customerId, productId, SalePaymentType.Installment, unitPrice)
        {
            Amount = downPaymentAmount + installmentAmount * (installmentCount - 1) + (lastInstallmentAmount ?? installmentAmount),
            DownPaymentAmount = downPaymentAmount,
            InstallmentCount = installmentCount,
            InstallmentAmount = installmentAmount,
            LastInstallmentAmount = lastInstallmentAmount,
            DueDate = dueDate?.Date
        };

    public void MarkAsPaid()
    {
        if (Status == SaleStatus.Paid) return;
        Status = SaleStatus.Paid;
        PaidAtUtc = DateTime.UtcNow;
    }
}
