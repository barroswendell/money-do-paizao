using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyDoPaizao.Application.Auth;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Services;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    IAuthService authService,
    ILogger<AuthController> logger) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Iniciando cadastro para o e-mail {Email}.", request.Email);

        try
        {
            var response = await authService.RegisterAsync(request, cancellationToken);
            logger.LogInformation("Cadastro concluído para o e-mail {Email}.", request.Email);
            return Created("api/auth/register", response);
        }
        catch (AuthValidationException exception)
        {
            logger.LogWarning("Cadastro recusado para o e-mail {Email}: {Reason}.", request.Email, exception.Message);
            return BadRequest(new { message = exception.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Iniciando login para o e-mail {Email}.", request.Email);

        try
        {
            var response = await authService.LoginAsync(request, cancellationToken);
            logger.LogInformation("Login concluído para o e-mail {Email}.", request.Email);
            return Ok(response);
        }
        catch (InvalidCredentialsException exception)
        {
            logger.LogWarning("Login recusado para o e-mail {Email}: {Reason}.", request.Email, exception.Message);
            return Unauthorized(new { message = exception.Message });
        }
    }
}
