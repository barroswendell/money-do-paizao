using System.Text.Json;

namespace MoneyDoPaizao.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            logger.LogWarning(
                "Requisição cancelada pelo cliente: {Method} {Path} TraceId={TraceId}",
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Erro não tratado na requisição: {Method} {Path} TraceId={TraceId}",
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json; charset=utf-8";

            // O CORS middleware não consegue adicionar o cabeçalho quando uma exceção
            // escapa da pipeline. O frontend precisa receber um JSON controlado para
            // exibir o erro sem mascará-lo como "Failed to fetch".
            if (context.Request.Headers.ContainsKey("Origin"))
            {
                context.Response.Headers.AccessControlAllowOrigin = "*";
            }

            var payload = JsonSerializer.Serialize(new
            {
                message = "O servidor não conseguiu concluir a operação.",
                traceId = context.TraceIdentifier
            });

            await context.Response.WriteAsync(payload);
        }
    }
}
