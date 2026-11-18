using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MoneyDoPaizao.Application.Customers;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Services;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/customers")]
public sealed class CustomersController(ICustomerService customerService) : ControllerBase
{
    private Guid AccountId => Guid.Parse(User.FindFirstValue("accountId")!);

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await customerService.GetAllAsync(AccountId, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CustomerCreateRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Created("api/customers", await customerService.CreateAsync(AccountId, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
