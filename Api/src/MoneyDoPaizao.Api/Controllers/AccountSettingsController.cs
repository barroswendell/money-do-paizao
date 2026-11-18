using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Application.Settings;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/account/settings")]
public sealed class AccountSettingsController(IAppearanceService appearanceService) : ControllerBase
{
    private Guid AccountId => Guid.Parse(User.FindFirstValue("accountId")!);

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        return Ok(await appearanceService.GetAsync(AccountId, cancellationToken));
    }

    [HttpPut]
    public async Task<IActionResult> Update(UpdateAppearanceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await appearanceService.UpdateAsync(AccountId, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
