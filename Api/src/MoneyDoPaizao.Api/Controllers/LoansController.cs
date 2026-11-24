using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Loans;
using MoneyDoPaizao.Application.Services;
using MoneyDoPaizao.Api.Security;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/loans")]
public sealed class LoansController(ILoanService loanService) : ControllerBase
{
    private const int MaxReceiptBytes = 5 * 1024 * 1024;
    private Guid AccountId => Guid.Parse(User.FindFirstValue("accountId")!);

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        if (!User.HasModule("Loans")) return Forbid();
        return Ok(await loanService.GetAllAsync(AccountId, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(LoanCreateRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Loans")) return Forbid();
        try
        {
            return Created("api/loans", await loanService.CreateAsync(AccountId, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:guid}/payments")]
    [Consumes("application/json")]
    public Task<IActionResult> RegisterPayment(Guid id, LoanPaymentRequest request, CancellationToken cancellationToken)
    {
        return RegisterPaymentAsync(id, request, null, cancellationToken);
    }

    [HttpPost("{id:guid}/payments")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxReceiptBytes + 64 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxReceiptBytes + 64 * 1024)]
    public Task<IActionResult> RegisterPaymentWithReceipt(Guid id, [FromForm] string type, [FromForm] Guid? requestId, IFormFile? receipt, CancellationToken cancellationToken)
    {
        return RegisterPaymentAsync(id, new LoanPaymentRequest(type, requestId), receipt, cancellationToken);
    }

    [HttpGet("{id:guid}/payments/{paymentId:guid}/receipt")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetPaymentReceipt(Guid id, Guid paymentId, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Loans")) return Forbid();
        var receipt = await loanService.GetPaymentReceiptAsync(AccountId, id, paymentId, cancellationToken);
        if (receipt is null) return NotFound();

        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(receipt.Content, receipt.ContentType, receipt.Name);
    }

    private async Task<IActionResult> RegisterPaymentAsync(Guid id, LoanPaymentRequest request, IFormFile? file, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Loans")) return Forbid();
        try
        {
            var receipt = file is null ? null : await ReadReceiptAsync(file, cancellationToken);
            return Ok(await loanService.RegisterPaymentAsync(AccountId, id, request, cancellationToken, receipt));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    private static async Task<LoanPaymentAttachment> ReadReceiptAsync(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length is <= 0 or > MaxReceiptBytes)
        {
            throw new BusinessValidationException("Escolha um comprovante de até 5 MB.");
        }

        using var buffer = new MemoryStream((int)file.Length);
        await file.CopyToAsync(buffer, cancellationToken);
        var content = buffer.ToArray();
        var (contentType, extension) = DetectReceiptType(content);
        var originalName = Path.GetFileNameWithoutExtension(file.FileName.Replace('\\', '/'));
        var name = new string(originalName
            .Where(character => !char.IsControl(character) && !"<>:\"/\\|?*".Contains(character))
            .Take(150)
            .ToArray()).Trim(' ', '.');
        return new LoanPaymentAttachment($"{(name.Length > 0 ? name : "comprovante")}{extension}", contentType, content);
    }

    private static (string ContentType, string Extension) DetectReceiptType(ReadOnlySpan<byte> content)
    {
        if (content.StartsWith("%PDF-"u8)) return ("application/pdf", ".pdf");
        if (content.StartsWith(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A })) return ("image/png", ".png");
        if (content.StartsWith(new byte[] { 0xFF, 0xD8, 0xFF })) return ("image/jpeg", ".jpg");

        throw new BusinessValidationException("Escolha um comprovante em PDF, JPG ou PNG.");
    }
}
