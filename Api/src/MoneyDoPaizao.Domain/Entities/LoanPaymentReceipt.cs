namespace MoneyDoPaizao.Domain.Entities;

public sealed class LoanPaymentReceipt
{
    private LoanPaymentReceipt()
    {
    }

    internal LoanPaymentReceipt(Guid paymentId, string contentType, byte[] content)
    {
        PaymentId = paymentId;
        ContentType = contentType;
        Content = content;
    }

    public Guid PaymentId { get; private set; }
    public string ContentType { get; private set; } = string.Empty;
    public byte[] Content { get; private set; } = [];
}
