using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Parties;
using MoneyDoPaizao.Application.Services;
using System.Security.Claims;
using MoneyDoPaizao.Api.Security;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/parties")]
public sealed class PartiesController(IPartyService partyService) : ControllerBase
{
    private Guid AccountId => Guid.Parse(User.FindFirstValue("accountId")!);

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        if (!User.HasModule("Parties")) return Forbid();
        return Ok(await partyService.GetDashboardAsync(AccountId, cancellationToken));
    }

    [HttpGet("themes")]
    public async Task<IActionResult> GetThemes(CancellationToken cancellationToken)
    {
        if (!User.HasModule("Parties")) return Forbid();
        return Ok(await partyService.GetThemesAsync(AccountId, cancellationToken));
    }

    [HttpPost("themes")]
    public async Task<IActionResult> CreateTheme(PartyThemeCreateRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Parties")) return Forbid();
        try
        {
            return Created("api/parties/themes", await partyService.CreateThemeAsync(AccountId, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(CancellationToken cancellationToken)
    {
        if (!User.HasModule("Parties")) return Forbid();
        return Ok(await partyService.GetProductsAsync(AccountId, cancellationToken));
    }

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct(PartyProductCreateRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Parties")) return Forbid();
        try
        {
            return Created("api/parties/products", await partyService.CreateProductAsync(AccountId, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet("events")]
    public async Task<IActionResult> GetEvents(CancellationToken cancellationToken)
    {
        if (!User.HasModule("Parties")) return Forbid();
        return Ok(await partyService.GetEventsAsync(AccountId, cancellationToken));
    }

    [HttpPost("events")]
    public async Task<IActionResult> CreateEvent(PartyEventCreateRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Parties")) return Forbid();
        try
        {
            return Created("api/parties/events", await partyService.CreateEventAsync(AccountId, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPatch("events/{eventId:guid}/received-amount")]
    public async Task<IActionResult> UpdateReceivedAmount(Guid eventId, PartyEventReceivedAmountRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Parties")) return Forbid();
        try
        {
            var partyEvent = await partyService.UpdateReceivedAmountAsync(AccountId, eventId, request, cancellationToken);
            return partyEvent is null ? NotFound() : Ok(partyEvent);
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("themes/{id:guid}")]
    public async Task<IActionResult> UpdateTheme(Guid id, PartyThemeCreateRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Parties")) return Forbid();
        try
        {
            var updated = await partyService.UpdateThemeAsync(AccountId, id, request, cancellationToken);
            return updated is null ? NotFound(new { message = "Registro não encontrado ou desativado." }) : Ok(updated);
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("products/{id:guid}")]
    public async Task<IActionResult> UpdateProduct(Guid id, PartyProductCreateRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Parties")) return Forbid();
        try
        {
            var updated = await partyService.UpdateProductAsync(AccountId, id, request, cancellationToken);
            return updated is null ? NotFound(new { message = "Registro não encontrado ou desativado." }) : Ok(updated);
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("events/{id:guid}")]
    public async Task<IActionResult> UpdateEvent(Guid id, PartyEventCreateRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Parties")) return Forbid();
        try
        {
            var updated = await partyService.UpdateEventAsync(AccountId, id, request, cancellationToken);
            return updated is null ? NotFound(new { message = "Registro não encontrado ou desativado." }) : Ok(updated);
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
