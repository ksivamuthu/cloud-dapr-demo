using System;
using System.Threading.Tasks;
using Dapr;
using Dapr.Client;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using OrderService.Models;

namespace OrderService.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class OrderController : ControllerBase
    {
        public const string StoreName = "statestore";

        private readonly ILogger<OrderController> _logger;
        private readonly DaprClient _daprClient;

        public OrderController(ILogger<OrderController> logger,
            [FromServices] DaprClient daprClient)
        {
            _logger = logger;
            _daprClient = daprClient;
        }

        [HttpPost]
        public async Task<ActionResult<Order>> CreateOrder([FromBody] Order order)
        {
            var orderId = Guid.NewGuid().ToString();
            var state = await _daprClient.GetStateEntryAsync<Order>(StoreName, orderId);
            order.Id ??= orderId;
            state.Value = order;
            await state.SaveAsync();
            await _daprClient.PublishEventAsync("OrderReceived", order);
            return state.Value;
        }

        [HttpGet("{orderId}")]
        public async Task<ActionResult<Order>> GetOrder(string orderId)
        {
            var state = await _daprClient.GetStateEntryAsync<Order>(StoreName, orderId);
            if (state.Value != null)
            {
                return state.Value;
            }

            return NotFound();
        }

        [Topic("OrderReceived")]
        [HttpPost("order-received")]
        public async Task<ActionResult<Order>> OrderReceived(Order order)
        {
            var state = await _daprClient.GetStateEntryAsync<Order>(StoreName, order.Id);
            state.Value.Status = "OrderReceived";
            await state.SaveAsync();
            return state.Value;
        }

        [Topic("Processing")]
        [HttpPost("order-processing")]
        public async Task<ActionResult<Order>> OrderProcessing(Order order)
        {
            var state = await _daprClient.GetStateEntryAsync<Order>(StoreName, order.Id);
            state.Value.Status = "Processing";
            await state.SaveAsync();
            return state.Value;
        }

        [Topic("ReadyToPickup")]
        [HttpPost("order-ready-to-pickup")]
        public async Task<ActionResult<Order>> ReadyToPickup(Order order, [FromServices] DaprClient daprClient)
        {
            var state = await daprClient.GetStateEntryAsync<Order>(StoreName, order.Id);
            state.Value.Status = "ReadyToPickup";
            await state.SaveAsync();
            return state.Value;
        }

        [Topic("DeliveryOnWay")]
        [HttpPost("order-delivery-on-way")]
        public async Task<ActionResult<Order>> DeliveryOnWay(Order order, [FromServices] DaprClient daprClient)
        {
            var state = await daprClient.GetStateEntryAsync<Order>(StoreName, order.Id);
            state.Value.Status = "DeliveryOnWay";
            await state.SaveAsync();
            return state.Value;
        }

        [Topic("Delivered")]
        [HttpPost("order-delivered")]
        public async Task<ActionResult<Order>> Delivered(Order order, [FromServices] DaprClient daprClient)
        {
            var state = await daprClient.GetStateEntryAsync<Order>(StoreName, order.Id);
            state.Value.Status = "Delivered";
            await state.SaveAsync();
            return state.Value;
        }
    }
}
