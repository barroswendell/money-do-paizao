using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/records")]
public sealed class RecordsController(IManagedRecordStore records) : ControllerBase
{
    private const int PageSize = 30;

    [HttpDelete("{kind}/{id:guid}")]
    public async Task<IActionResult> Deactivate(string kind, Guid id, CancellationToken cancellationToken)
    {
        if (!TryReadScope(out var accountId, out var module)) return Forbid();
        if (!TryReadKind(kind, out var recordKind)) return NotFound();
        if (!BelongsToModule(recordKind, module)) return Forbid();

        return await records.DeactivateAsync(accountId, module, recordKind, id, cancellationToken) ? NoContent() : NotFound();
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] string? kind, [FromQuery] Guid? recordId,
        [FromQuery] int page = 1, CancellationToken cancellationToken = default)
    {
        if (!TryReadScope(out var accountId, out var module)) return Forbid();
        if (page is < 1 or > 1_000_000) return BadRequest(new { message = "Página de histórico inválida." });

        RecordKind? recordKind = null;
        if (kind is not null)
        {
            if (!TryReadKind(kind, out var parsed)) return BadRequest(new { message = "Tipo de registro inválido." });
            if (!BelongsToModule(parsed, module)) return Forbid();
            recordKind = parsed;
        }

        var rows = await records.GetHistoryAsync(accountId, module, recordKind, recordId, (page - 1) * PageSize, PageSize + 1, cancellationToken);
        return Ok(new
        {
            Items = rows.Take(PageSize).Select(row => new
            {
                row.Id, row.Kind, row.RecordId, row.RecordName, row.UserId, row.UserName, row.OccurredAtUtc, row.Action,
                Changes = JsonSerializer.Deserialize<JsonElement>(row.Changes)
            }),
            HasMore = rows.Count > PageSize,
            Page = page
        });
    }

    private bool TryReadScope(out Guid accountId, out ProductModule module)
    {
        var hasAccount = Guid.TryParse(User.FindFirstValue("accountId"), out accountId);
        var moduleClaim = User.FindFirstValue("module");
        return Enum.TryParse(moduleClaim, out module) && Enum.IsDefined(module) && hasAccount;
    }

    private static bool TryReadKind(string value, out RecordKind result) =>
        Enum.TryParse(value, true, out result) && Enum.IsDefined(result) && string.Equals(result.ToString(), value, StringComparison.OrdinalIgnoreCase);

    private static bool BelongsToModule(RecordKind kind, ProductModule module) => kind == RecordKind.Customer
        ? module is ProductModule.Loans or ProductModule.Parties or ProductModule.Sales
        : RecordModule.For(kind) == module;
}
