"""
Pydantic models for Kraken API responses

Type-safe models for all API response types.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Dict, List, Optional, Any

from pydantic import BaseModel, Field, validator


class OrderType(str, Enum):
    """Order types."""
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop-loss"
    TAKE_PROFIT = "take-profit"
    STOP_LOSS_LIMIT = "stop-loss-limit"
    TAKE_PROFIT_LIMIT = "take-profit-limit"
    SETTLE_POSITION = "settle-position"


class OrderSide(str, Enum):
    """Order side."""
    BUY = "buy"
    SELL = "sell"


class OrderStatus(str, Enum):
    """Order status."""
    PENDING = "pending"
    OPEN = "open"
    CLOSED = "closed"
    CANCELED = "canceled"
    EXPIRED = "expired"


class SystemStatus(BaseModel):
    """System status model."""
    status: str
    timestamp: datetime


class ServerTime(BaseModel):
    """Server time model."""
    unixtime: int
    rfc1123: str

    @property
    def datetime(self) -> datetime:
        """Convert unix timestamp to datetime."""
        return datetime.fromtimestamp(self.unixtime)


class AssetInfo(BaseModel):
    """Asset information model."""
    altname: str
    decimals: int
    display_decimals: int
    aclass: Optional[str] = None


class AssetPair(BaseModel):
    """Trading pair information."""
    altname: str
    wsname: Optional[str] = None
    aclass_base: str
    base: str
    aclass_quote: str
    quote: str
    lot: str
    pair_decimals: int
    lot_decimals: int
    lot_multiplier: int
    leverage_buy: List[int]
    leverage_sell: List[int]
    fees: List[List[Decimal]]
    fees_maker: Optional[List[List[Decimal]]] = None
    fee_volume_currency: str
    margin_call: int
    margin_stop: int
    ordermin: Optional[str] = None


class Ticker(BaseModel):
    """Ticker information model."""
    ask: List[str]  # [price, whole lot volume, lot volume]
    bid: List[str]  # [price, whole lot volume, lot volume]
    last: List[str]  # [price, lot volume]
    volume: List[str]  # [today, last 24 hours]
    vwap: List[str]  # [today, last 24 hours]
    trades: List[int]  # [today, last 24 hours]
    low: List[str]  # [today, last 24 hours]
    high: List[str]  # [today, last 24 hours]
    opening: str

    @property
    def last_price(self) -> Decimal:
        """Get last trade price."""
        return Decimal(self.last[0])

    @property
    def ask_price(self) -> Decimal:
        """Get best ask price."""
        return Decimal(self.ask[0])

    @property
    def bid_price(self) -> Decimal:
        """Get best bid price."""
        return Decimal(self.bid[0])

    @property
    def volume_24h(self) -> Decimal:
        """Get 24 hour volume."""
        return Decimal(self.volume[1])


class OHLC(BaseModel):
    """OHLC data model."""
    time: int
    open: str
    high: str
    low: str
    close: str
    vwap: str
    volume: str
    count: int


class OrderBook(BaseModel):
    """Order book model."""
    asks: List[List[str]]  # [[price, volume, timestamp], ...]
    bids: List[List[str]]  # [[price, volume, timestamp], ...]


class Trade(BaseModel):
    """Trade information model."""
    price: str
    volume: str
    time: float
    side: OrderSide
    ordertype: OrderType
    misc: str


class Balance(BaseModel):
    """Account balance model."""
    currency: str
    balance: Decimal
    available: Decimal
    hold: Decimal

    @classmethod
    def from_api_response(cls, currency: str, balance_str: str) -> "Balance":
        """Create Balance from API response."""
        balance = Decimal(balance_str)
        return cls(
            currency=currency,
            balance=balance,
            available=balance,  # Simplified - real implementation would calculate
            hold=Decimal("0")
        )


class Order(BaseModel):
    """Order model."""
    txid: Optional[str] = None
    refid: Optional[str] = None
    userref: Optional[str] = None
    status: OrderStatus
    opentm: Optional[float] = None
    starttm: Optional[float] = None
    expiretm: Optional[float] = None
    descr: Dict[str, Any]
    vol: str
    vol_exec: str
    cost: str
    fee: str
    price: str
    stopprice: Optional[str] = None
    limitprice: Optional[str] = None
    trigger: Optional[str] = None
    misc: str
    oflags: str

    @property
    def is_open(self) -> bool:
        """Check if order is open."""
        return self.status in [OrderStatus.PENDING, OrderStatus.OPEN]

    @property
    def volume(self) -> Decimal:
        """Get order volume."""
        return Decimal(self.vol)

    @property
    def executed_volume(self) -> Decimal:
        """Get executed volume."""
        return Decimal(self.vol_exec)


class TradeHistory(BaseModel):
    """Trade history entry."""
    ordertxid: str
    pair: str
    time: float
    type: OrderSide
    ordertype: OrderType
    price: str
    cost: str
    fee: str
    vol: str
    margin: str
    misc: str
    posstatus: Optional[str] = None
    cprice: Optional[str] = None
    ccost: Optional[str] = None
    cfee: Optional[str] = None
    cvol: Optional[str] = None
    cmargin: Optional[str] = None
    trade_id: Optional[str] = None

    @property
    def datetime(self) -> datetime:
        """Convert timestamp to datetime."""
        return datetime.fromtimestamp(self.time)


class DepositMethod(BaseModel):
    """Deposit method information."""
    method: str
    limit: Optional[str] = None
    fee: Optional[str] = None
    setup_fee: Optional[str] = None
    gen_address: bool = False


class DepositAddress(BaseModel):
    """Deposit address information."""
    address: str
    expiretm: Optional[float] = None
    tag: Optional[str] = None


class WithdrawalInfo(BaseModel):
    """Withdrawal information."""
    method: str
    limit: str
    amount: str
    fee: str


class LedgerEntry(BaseModel):
    """Ledger entry model."""
    refid: str
    time: float
    type: str
    subtype: str
    aclass: str
    asset: str
    amount: str
    fee: str
    balance: str

    @property
    def datetime(self) -> datetime:
        """Convert timestamp to datetime."""
        return datetime.fromtimestamp(self.time)


class Position(BaseModel):
    """Position model."""
    ordertxid: str
    posstatus: str
    pair: str
    time: float
    type: OrderSide
    ordertype: OrderType
    cost: str
    fee: str
    vol: str
    vol_closed: str
    margin: str
    value: Optional[str] = None
    net: Optional[str] = None
    terms: str
    rollovertm: float
    misc: str
    oflags: str


# Response wrapper models
class APIResponse(BaseModel):
    """Base API response model."""
    error: List[str] = Field(default_factory=list)
    result: Optional[Dict[str, Any]] = None

    @property
    def is_success(self) -> bool:
        """Check if response is successful."""
        return len(self.error) == 0

    @property
    def error_message(self) -> Optional[str]:
        """Get error message if present."""
        return self.error[0] if self.error else None


class TickerResponse(APIResponse):
    """Ticker response model."""
    result: Optional[Dict[str, Ticker]] = None


class BalanceResponse(APIResponse):
    """Balance response model."""
    result: Optional[Dict[str, str]] = None

    def to_balances(self) -> List[Balance]:
        """Convert to Balance objects."""
        if not self.result:
            return []
        return [
            Balance.from_api_response(currency, balance)
            for currency, balance in self.result.items()
        ]


class OrderResponse(APIResponse):
    """Order placement response."""
    result: Optional[Dict[str, Any]] = None

    @property
    def txid(self) -> Optional[List[str]]:
        """Get transaction IDs."""
        return self.result.get("txid") if self.result else None

    @property
    def descr(self) -> Optional[Dict[str, Any]]:
        """Get order description."""
        return self.result.get("descr") if self.result else None