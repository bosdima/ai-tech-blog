#!/usr/bin/env python3
"""
Bybit to DEX Arbitrage Agent
Арбитраж между Bybit и DEX биржами - только крипто, без банков!
"""

import json
import time
import random
import logging
import argparse
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

# Configuration
CONFIG_FILE = "bybit_dex_arbitrage_config.json"
LOG_FILE = "bybit_dex_arbitrage_logs.txt"
RESULTS_FILE = "bybit_dex_arbitrage_results.json"

class ArbitrageType(Enum):
    BYBIT_TO_UNISWAP = "bybit_to_uniswap"
    BYBIT_TO_PANCAKESWAP = "bybit_to_pancakeswap"
    BYBIT_TO_CURVE = "bybit_to_curve"
    BYBIT_TO_SUSHISWAP = "bybit_to_sushiswap"

@dataclass
class PriceData:
    platform: str
    pair: str
    price: float
    volume_24h: float
    timestamp: datetime

@dataclass
class ArbitrageOpportunity:
    type: ArbitrageType
    pair: str
    buy_platform: str
    sell_platform: str
    buy_price: float
    sell_price: float
    profit_percentage: float
    estimated_profit_usd: float
    volume: float
    gas_cost_usd: float
    net_profit_usd: float
    timestamp: datetime

@dataclass
class TradeExecution:
    opportunity: ArbitrageOpportunity
    buy_amount: float
    sell_amount: float
    fees: float
    gas_fees: float
    net_profit: float
    timestamp: datetime

class BybitDEXArbitrageAgent:
    def __init__(self, config_file: str = CONFIG_FILE):
        self.config = self.load_config(config_file)
        self.logger = self.setup_logging()
        self.results = {
            "opportunities": [],
            "executed_trades": [],
            "prices": {},
            "gas_prices": {},
            "errors": []
        }
        
        # Base prices for realistic simulation
        self.base_prices = {
            "BTC/USDT": 25000,
            "ETH/USDT": 1250,
            "BNB/USDT": 300,
            "XRP/USDT": 0.6,
            "USDT/USDC": 1.0,
            "USDC/USDT": 1.0,
            "DAI/USDC": 1.0,
            "crvUSD/USDC": 1.0
        }
        
        # Map DEX pairs to base price pairs
        self.pair_mapping = {
            "USDT/USDC": "USDT/USDT",
            "DAI/USDC": "USDT/USDC", 
            "crvUSD/USDC": "USDT/USDC"
        }
        
        # Gas price simulation (in Gwei)
        self.base_gas_price = 30
        
    def load_config(self, config_file: str) -> Dict:
        """Load configuration from JSON file"""
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            self.logger.error(f"Configuration file {config_file} not found")
            raise
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in configuration file: {e}")
            raise
    
    def setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logger = logging.getLogger('bybit_dex_arbitrage')
        logger.setLevel(logging.INFO)
        
        # File handler
        file_handler = logging.FileHandler(LOG_FILE)
        file_handler.setLevel(logging.INFO)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # Formatter
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        return logger
    
    def generate_bybit_price(self, pair: str) -> PriceData:
        """Generate realistic Bybit prices"""
        base_price = self.base_prices[pair]
        
        # Bybit has slightly different pricing
        variation = random.uniform(-0.001, 0.001)  # ±0.1%
        price = base_price * (1 + variation)
        
        # Update base price for next iteration
        self.base_prices[pair] = price * (1 + random.uniform(-0.0001, 0.0001))
        
        volume = random.uniform(1000000, 5000000)
        
        return PriceData(
            platform="bybit",
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def generate_uniswap_price(self, pair: str) -> PriceData:
        """Generate realistic Uniswap prices"""
        base_price = self.base_prices[pair]
        
        # Uniswap has slightly higher prices due to fees
        variation = random.uniform(0.0005, 0.002)  # +0.05-0.2%
        price = base_price * (1 + variation)
        
        volume = random.uniform(500000, 2000000)
        
        return PriceData(
            platform="uniswap_v3",
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def generate_pancakeswap_price(self, pair: str) -> PriceData:
        """Generate realistic PancakeSwap prices"""
        base_price = self.base_prices[pair]
        
        # PancakeSwap has competitive pricing
        variation = random.uniform(0.0003, 0.0015)  # +0.03-0.15%
        price = base_price * (1 + variation)
        
        volume = random.uniform(300000, 1500000)
        
        return PriceData(
            platform="pancakeswap_v3",
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def generate_curve_price(self, pair: str) -> PriceData:
        """Generate realistic Curve Finance prices"""
        # Map DEX pairs to base price pairs
        base_pair = self.pair_mapping.get(pair, "USDT/USDC")
        if base_pair not in self.base_prices:
            base_pair = "USDT/USDC"
        base_price = self.base_prices[base_pair]
        
        # Curve has very tight spreads for stablecoins
        variation = random.uniform(-0.0001, 0.0001)  # ±0.01%
        price = base_price * (1 + variation)
        
        volume = random.uniform(100000, 500000)
        
        return PriceData(
            platform="curve_finance",
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def generate_sushiswap_price(self, pair: str) -> PriceData:
        """Generate realistic SushiSwap prices"""
        base_price = self.base_prices[pair]
        
        # SushiSwap has competitive pricing
        variation = random.uniform(0.0004, 0.0018)  # +0.04-0.18%
        price = base_price * (1 + variation)
        
        volume = random.uniform(200000, 1000000)
        
        return PriceData(
            platform="sushiswap",
            pair=pair,
            price=price,
            volume_24h=volume,
            timestamp=datetime.now()
        )
    
    def generate_gas_price(self) -> float:
        """Generate realistic gas prices"""
        base_gas_price = self.base_gas_price
        
        # Add some volatility
        variation = random.uniform(-5, 15)  # ±5-15 Gwei
        gas_price = base_gas_price + variation
        
        # Update base gas price
        self.base_gas_price = gas_price * (1 + random.uniform(-0.01, 0.01))
        
        return max(gas_price, 10)  # Minimum 10 Gwei
    
    def fetch_all_prices(self) -> Dict[str, List[PriceData]]:
        """Fetch prices from all platforms"""
        all_prices = {}
        
        # Fetch Bybit prices
        bybit_prices = []
        for pair in self.config["bybit_dex_arbitrage_agent"]["bybit_settings"]["pairs"]:
            price_data = self.generate_bybit_price(pair)
            bybit_prices.append(price_data)
        all_prices["bybit"] = bybit_prices
        
        # Fetch DEX prices
        for dex_name, dex_config in self.config["bybit_dex_arbitrage_agent"]["dex_platforms"].items():
            dex_prices = []
            for pair in dex_config["pairs"]:
                if dex_name == "uniswap_v3":
                    price_data = self.generate_uniswap_price(pair)
                elif dex_name == "pancakeswap_v3":
                    price_data = self.generate_pancakeswap_price(pair)
                elif dex_name == "curve_finance":
                    price_data = self.generate_curve_price(pair)
                elif dex_name == "sushiswap":
                    price_data = self.generate_sushiswap_price(pair)
                else:
                    continue
                
                dex_prices.append(price_data)
            all_prices[dex_name] = dex_prices
        
        return all_prices
    
    def find_bybit_to_uniswap_arbitrage(self, all_prices: Dict[str, List[PriceData]]) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities between Bybit and Uniswap"""
        opportunities = []
        
        for pair in ["BTC/USDT", "ETH/USDT", "USDC/USDT"]:
            # Get Bybit price
            bybit_price = None
            for price_data in all_prices["bybit"]:
                if price_data.pair == pair:
                    bybit_price = price_data
                    break
            
            # Get Uniswap price
            uniswap_price = None
            for price_data in all_prices["uniswap_v3"]:
                if price_data.pair == pair:
                    uniswap_price = price_data
                    break
            
            if bybit_price and uniswap_price:
                # Calculate potential arbitrage
                if bybit_price.price < uniswap_price.price:
                    # Buy on Bybit, sell on Uniswap
                    price_diff = uniswap_price.price - bybit_price.price
                    profit_percentage = (price_diff / bybit_price.price)
                    
                    # Check threshold
                    threshold = self.config["bybit_dex_arbitrage_agent"]["arbitrage_strategies"]["bybit_to_uniswap"]["min_profit_threshold"]
                    if profit_percentage >= threshold:
                        # Calculate volume based on pair
                        if pair == "BTC/USDT":
                            volume = min(0.01, 1000 / bybit_price.price)
                        elif pair == "ETH/USDT":
                            volume = min(0.1, 1000 / bybit_price.price)
                        else:
                            volume = min(1000 / bybit_price.price, 1000)
                        
                        # Calculate gas cost
                        gas_price = self.generate_gas_price()
                        gas_cost_usd = (gas_price * 300000) / 1e9 * 2000  # $2000 per ETH
                        
                        # Calculate net profit
                        estimated_profit_usd = price_diff * volume
                        net_profit_usd = estimated_profit_usd - gas_cost_usd
                        
                        opportunity = ArbitrageOpportunity(
                            type=ArbitrageType.BYBIT_TO_UNISWAP,
                            pair=pair,
                            buy_platform="bybit",
                            sell_platform="uniswap_v3",
                            buy_price=bybit_price.price,
                            sell_price=uniswap_price.price,
                            profit_percentage=profit_percentage,
                            estimated_profit_usd=estimated_profit_usd,
                            volume=volume,
                            gas_cost_usd=gas_cost_usd,
                            net_profit_usd=net_profit_usd,
                            timestamp=datetime.now()
                        )
                        opportunities.append(opportunity)
        
        return opportunities
    
    def find_bybit_to_pancakeswap_arbitrage(self, all_prices: Dict[str, List[PriceData]]) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities between Bybit and PancakeSwap"""
        opportunities = []
        
        for pair in ["BTC/USDT", "ETH/USDT", "BNB/USDT"]:
            # Get Bybit price
            bybit_price = None
            for price_data in all_prices["bybit"]:
                if price_data.pair == pair:
                    bybit_price = price_data
                    break
            
            # Get PancakeSwap price
            pancakeswap_price = None
            for price_data in all_prices["pancakeswap_v3"]:
                if price_data.pair == pair:
                    pancakeswap_price = price_data
                    break
            
            if bybit_price and pancakeswap_price:
                # Calculate potential arbitrage
                if bybit_price.price < pancakeswap_price.price:
                    # Buy on Bybit, sell on PancakeSwap
                    price_diff = pancakeswap_price.price - bybit_price.price
                    profit_percentage = (price_diff / bybit_price.price)
                    
                    # Check threshold
                    threshold = self.config["bybit_dex_arbitrage_agent"]["arbitrage_strategies"]["bybit_to_pancakeswap"]["min_profit_threshold"]
                    if profit_percentage >= threshold:
                        # Calculate volume based on pair
                        if pair == "BTC/USDT":
                            volume = min(0.01, 1000 / bybit_price.price)
                        elif pair == "ETH/USDT":
                            volume = min(0.1, 1000 / bybit_price.price)
                        elif pair == "BNB/USDT":
                            volume = min(1.0, 1000 / bybit_price.price)
                        else:
                            volume = min(1000 / bybit_price.price, 1000)
                        
                        # Calculate gas cost (BSC is cheaper)
                        gas_price = self.generate_gas_price() * 0.3  # BSC is cheaper
                        gas_cost_usd = (gas_price * 250000) / 1e9 * 300  # $300 per BNB
                        
                        # Calculate net profit
                        estimated_profit_usd = price_diff * volume
                        net_profit_usd = estimated_profit_usd - gas_cost_usd
                        
                        opportunity = ArbitrageOpportunity(
                            type=ArbitrageType.BYBIT_TO_PANCAKESWAP,
                            pair=pair,
                            buy_platform="bybit",
                            sell_platform="pancakeswap_v3",
                            buy_price=bybit_price.price,
                            sell_price=pancakeswap_price.price,
                            profit_percentage=profit_percentage,
                            estimated_profit_usd=estimated_profit_usd,
                            volume=volume,
                            gas_cost_usd=gas_cost_usd,
                            net_profit_usd=net_profit_usd,
                            timestamp=datetime.now()
                        )
                        opportunities.append(opportunity)
        
        return opportunities
    
    def find_bybit_to_curve_arbitrage(self, all_prices: Dict[str, List[PriceData]]) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities between Bybit and Curve Finance"""
        opportunities = []
        
        for pair in ["USDT/USDC", "DAI/USDC", "crvUSD/USDC"]:
            # Map DEX pairs to base price pairs
            base_pair = self.pair_mapping.get(pair, "USDT/USDT")
            
            # Get Bybit price (for stablecoins, we use USDT price)
            bybit_price = None
            for price_data in all_prices["bybit"]:
                if price_data.pair == base_pair:
                    bybit_price = price_data
                    break
            
            # Get Curve price
            curve_price = None
            for price_data in all_prices["curve_finance"]:
                if price_data.pair == pair:
                    curve_price = price_data
                    break
            
            if bybit_price and curve_price:
                # Calculate potential arbitrage
                if bybit_price.price < curve_price.price:
                    # Buy on Bybit, sell on Curve
                    price_diff = curve_price.price - bybit_price.price
                    profit_percentage = (price_diff / bybit_price.price)
                    
                    # Check threshold
                    threshold = self.config["bybit_dex_arbitrage_agent"]["arbitrage_strategies"]["bybit_to_curve"]["min_profit_threshold"]
                    if profit_percentage >= threshold:
                        # Calculate volume
                        volume = min(10000, 10000 / bybit_price.price)
                        
                        # Calculate gas cost
                        gas_price = self.generate_gas_price()
                        gas_cost_usd = (gas_price * 200000) / 1e9 * 2000  # $2000 per ETH
                        
                        # Calculate net profit
                        estimated_profit_usd = price_diff * volume
                        net_profit_usd = estimated_profit_usd - gas_cost_usd
                        
                        opportunity = ArbitrageOpportunity(
                            type=ArbitrageType.BYBIT_TO_CURVE,
                            pair=pair,
                            buy_platform="bybit",
                            sell_platform="curve_finance",
                            buy_price=bybit_price.price,
                            sell_price=curve_price.price,
                            profit_percentage=profit_percentage,
                            estimated_profit_usd=estimated_profit_usd,
                            volume=volume,
                            gas_cost_usd=gas_cost_usd,
                            net_profit_usd=net_profit_usd,
                            timestamp=datetime.now()
                        )
                        opportunities.append(opportunity)
        
        return opportunities
    
    def find_bybit_to_sushiswap_arbitrage(self, all_prices: Dict[str, List[PriceData]]) -> List[ArbitrageOpportunity]:
        """Find arbitrage opportunities between Bybit and SushiSwap"""
        opportunities = []
        
        for pair in ["BTC/USDT", "ETH/USDT", "USDC/USDT"]:
            # Get Bybit price
            bybit_price = None
            for price_data in all_prices["bybit"]:
                if price_data.pair == pair:
                    bybit_price = price_data
                    break
            
            # Get SushiSwap price
            sushiswap_price = None
            for price_data in all_prices["sushiswap"]:
                if price_data.pair == pair:
                    sushiswap_price = price_data
                    break
            
            if bybit_price and sushiswap_price:
                # Calculate potential arbitrage
                if bybit_price.price < sushiswap_price.price:
                    # Buy on Bybit, sell on SushiSwap
                    price_diff = sushiswap_price.price - bybit_price.price
                    profit_percentage = (price_diff / bybit_price.price)
                    
                    # Check threshold
                    threshold = self.config["bybit_dex_arbitrage_agent"]["arbitrage_strategies"]["bybit_to_sushiswap"]["min_profit_threshold"]
                    if profit_percentage >= threshold:
                        # Calculate volume based on pair
                        if pair == "BTC/USDT":
                            volume = min(0.01, 1000 / bybit_price.price)
                        elif pair == "ETH/USDT":
                            volume = min(0.1, 1000 / bybit_price.price)
                        else:
                            volume = min(1000 / bybit_price.price, 1000)
                        
                        # Calculate gas cost
                        gas_price = self.generate_gas_price()
                        gas_cost_usd = (gas_price * 300000) / 1e9 * 2000  # $2000 per ETH
                        
                        # Calculate net profit
                        estimated_profit_usd = price_diff * volume
                        net_profit_usd = estimated_profit_usd - gas_cost_usd
                        
                        opportunity = ArbitrageOpportunity(
                            type=ArbitrageType.BYBIT_TO_SUSHISWAP,
                            pair=pair,
                            buy_platform="bybit",
                            sell_platform="sushiswap",
                            buy_price=bybit_price.price,
                            sell_price=sushiswap_price.price,
                            profit_percentage=profit_percentage,
                            estimated_profit_usd=estimated_profit_usd,
                            volume=volume,
                            gas_cost_usd=gas_cost_usd,
                            net_profit_usd=net_profit_usd,
                            timestamp=datetime.now()
                        )
                        opportunities.append(opportunity)
        
        return opportunities
    
    def execute_trade(self, opportunity: ArbitrageOpportunity) -> Optional[TradeExecution]:
        """Execute a trade (mock implementation)"""
        try:
            # Calculate fees
            bybit_fee = opportunity.buy_price * opportunity.volume * self.config["bybit_dex_arbitrage_agent"]["bybit_settings"]["fee"]
            dex_fee = opportunity.sell_price * opportunity.volume * 0.003  # 0.3% DEX fee
            
            # Calculate net profit
            gross_profit = (opportunity.sell_price - opportunity.buy_price) * opportunity.volume
            total_fees = bybit_fee + dex_fee + opportunity.gas_cost_usd
            net_profit = gross_profit - total_fees
            
            # Create trade execution
            execution = TradeExecution(
                opportunity=opportunity,
                buy_amount=opportunity.volume,
                sell_amount=opportunity.volume,
                fees=total_fees,
                gas_fees=opportunity.gas_cost_usd,
                net_profit=net_profit,
                timestamp=datetime.now()
            )
            
            self.results["executed_trades"].append(execution)
            return execution
            
        except Exception as e:
            self.logger.error(f"Error executing trade: {e}")
            return None
    
    def run_monitoring_cycle(self) -> Dict[str, Any]:
        """Run one complete monitoring cycle"""
        self.logger.info("Starting Bybit to DEX arbitrage monitoring cycle...")
        
        try:
            # Fetch prices from all platforms
            self.logger.info("Fetching prices from all platforms...")
            all_prices = self.fetch_all_prices()
            
            # Store prices
            self.results["prices"] = {
                platform: [
                    {
                        "pair": p.pair,
                        "price": p.price,
                        "volume_24h": p.volume_24h,
                        "timestamp": p.timestamp.isoformat()
                    }
                    for p in prices
                ]
                for platform, prices in all_prices.items()
            }
            
            # Fetch gas prices
            self.results["gas_prices"] = {
                "ethereum": self.generate_gas_price(),
                "binance_smart_chain": self.generate_gas_price() * 0.3
            }
            
            # Find arbitrage opportunities
            self.logger.info("Searching for arbitrage opportunities...")
            
            # Bybit to Uniswap
            uniswap_opps = self.find_bybit_to_uniswap_arbitrage(all_prices)
            self.results["opportunities"].extend([
                {
                    "type": opp.type.value,
                    "pair": opp.pair,
                    "buy_platform": opp.buy_platform,
                    "sell_platform": opp.sell_platform,
                    "buy_price": opp.buy_price,
                    "sell_price": opp.sell_price,
                    "profit_percentage": opp.profit_percentage,
                    "estimated_profit_usd": opp.estimated_profit_usd,
                    "volume": opp.volume,
                    "gas_cost_usd": opp.gas_cost_usd,
                    "net_profit_usd": opp.net_profit_usd,
                    "timestamp": opp.timestamp.isoformat()
                }
                for opp in uniswap_opps
            ])
            
            # Bybit to PancakeSwap
            pancakeswap_opps = self.find_bybit_to_pancakeswap_arbitrage(all_prices)
            self.results["opportunities"].extend([
                {
                    "type": opp.type.value,
                    "pair": opp.pair,
                    "buy_platform": opp.buy_platform,
                    "sell_platform": opp.sell_platform,
                    "buy_price": opp.buy_price,
                    "sell_price": opp.sell_price,
                    "profit_percentage": opp.profit_percentage,
                    "estimated_profit_usd": opp.estimated_profit_usd,
                    "volume": opp.volume,
                    "gas_cost_usd": opp.gas_cost_usd,
                    "net_profit_usd": opp.net_profit_usd,
                    "timestamp": opp.timestamp.isoformat()
                }
                for opp in pancakeswap_opps
            ])
            
            # Bybit to Curve
            curve_opps = self.find_bybit_to_curve_arbitrage(all_prices)
            self.results["opportunities"].extend([
                {
                    "type": opp.type.value,
                    "pair": opp.pair,
                    "buy_platform": opp.buy_platform,
                    "sell_platform": opp.sell_platform,
                    "buy_price": opp.buy_price,
                    "sell_price": opp.sell_price,
                    "profit_percentage": opp.profit_percentage,
                    "estimated_profit_usd": opp.estimated_profit_usd,
                    "volume": opp.volume,
                    "gas_cost_usd": opp.gas_cost_usd,
                    "net_profit_usd": opp.net_profit_usd,
                    "timestamp": opp.timestamp.isoformat()
                }
                for opp in curve_opps
            ])
            
            # Bybit to SushiSwap
            sushiswap_opps = self.find_bybit_to_sushiswap_arbitrage(all_prices)
            self.results["opportunities"].extend([
                {
                    "type": opp.type.value,
                    "pair": opp.pair,
                    "buy_platform": opp.buy_platform,
                    "sell_platform": opp.sell_platform,
                    "buy_price": opp.buy_price,
                    "sell_price": opp.sell_price,
                    "profit_percentage": opp.profit_percentage,
                    "estimated_profit_usd": opp.estimated_profit_usd,
                    "volume": opp.volume,
                    "gas_cost_usd": opp.gas_cost_usd,
                    "net_profit_usd": opp.net_profit_usd,
                    "timestamp": opp.timestamp.isoformat()
                }
                for opp in sushiswap_opps
            ])
            
            # Execute profitable trades
            self.logger.info("Executing profitable trades...")
            all_opportunities = uniswap_opps + pancakeswap_opps + curve_opps + sushiswap_opps
            for opportunity in all_opportunities:
                if opportunity.net_profit_usd >= 10:  # $10 minimum profit
                    execution = self.execute_trade(opportunity)
                    if execution:
                        self.logger.info(f"Executed trade: {execution.net_profit:.2f} USD profit")
            
            # Save results
            self.save_results()
            
            # Generate alerts
            self.generate_alerts()
            
            self.logger.info("Monitoring cycle completed successfully")
            
            return {
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "opportunities_found": len(all_opportunities),
                "trades_executed": len([t for t in self.results["executed_trades"] if t.timestamp >= datetime.now() - timedelta(minutes=5)]),
                "total_profit": sum(t.net_profit for t in self.results["executed_trades"] if t.timestamp >= datetime.now() - timedelta(minutes=5))
            }
            
        except Exception as e:
            self.logger.error(f"Error in monitoring cycle: {e}")
            self.results["errors"].append(f"Cycle error: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def generate_alerts(self) -> Dict[str, List[str]]:
        """Generate alerts based on thresholds"""
        alerts = {
            "high_profit_opportunity": [],
            "trade_executed": [],
            "high_gas_price": []
        }
        
        # High profit opportunity alerts
        for opp in self.results["opportunities"]:
            if opp["profit_percentage"] >= 0.01:  # 1% threshold
                alerts["high_profit_opportunity"].append(
                    f"{opp['pair']}: {opp['buy_platform']} → {opp['sell_platform']} ({opp['profit_percentage']:.2%}, ${opp['net_profit_usd']:.2f})"
                )
        
        # Trade execution alerts
        for trade in self.results["executed_trades"]:
            if trade.net_profit >= 50:  # $50 threshold
                alerts["trade_executed"].append(
                    f"{trade.opportunity.pair}: ${trade.net_profit:.2f} profit"
                )
        
        # High gas price alerts
        if self.results["gas_prices"]["ethereum"] > 50:
            alerts["high_gas_price"].append(
                f"Ethereum gas price: {self.results['gas_prices']['ethereum']:.1f} Gwei"
            )
        
        return alerts
    
    def save_results(self) -> None:
        """Save results to file"""
        with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        self.logger.info(f"Results saved to {RESULTS_FILE}")
    
    def run_continuous(self, interval_minutes: int = 2) -> None:
        """Run agent continuously"""
        self.logger.info(f"Starting continuous monitoring with {interval_minutes} minute intervals")
        
        while True:
            try:
                result = self.run_monitoring_cycle()
                
                if result["status"] == "success":
                    self.logger.info(f"Cycle completed: {result['opportunities_found']} opportunities found, {result['trades_executed']} trades executed")
                
                time.sleep(interval_minutes * 60)
                
            except KeyboardInterrupt:
                self.logger.info("Received keyboard interrupt, stopping...")
                break
            except Exception as e:
                self.logger.error(f"Error in continuous mode: {e}")
                time.sleep(60)  # Wait before retrying
    
    def run_single_cycle(self) -> None:
        """Run single monitoring cycle"""
        result = self.run_monitoring_cycle()
        
        if result["status"] == "success":
            print(f"✅ Cycle completed successfully!")
            print(f"📊 Opportunities found: {result['opportunities_found']}")
            print(f"💰 Trades executed: {result['trades_executed']}")
            print(f"🎯 Total profit: ${result['total_profit']:.2f}")
        else:
            print(f"❌ Error: {result['error']}")

def main():
    parser = argparse.ArgumentParser(description="Bybit to DEX Arbitrage Agent")
    parser.add_argument("--config", default=CONFIG_FILE, help="Configuration file path")
    parser.add_argument("--continuous", action="store_true", help="Run continuously")
    parser.add_argument("--interval", type=int, default=2, help="Interval in minutes for continuous mode")
    parser.add_argument("--single", action="store_true", help="Run single cycle only")
    parser.add_argument("--status", action="store_true", help="Show current status")
    
    args = parser.parse_args()
    
    try:
        agent = BybitDEXArbitrageAgent(args.config)
        
        if args.status:
            # Show current status
            if os.path.exists(RESULTS_FILE):
                with open(RESULTS_FILE, 'r', encoding='utf-8') as f:
                    results = json.load(f)
                
                print("📊 Current Status:")
                print(f"Total opportunities: {len(results['opportunities'])}")
                print(f"Total trades: {len(results['executed_trades'])}")
                print(f"Recent profit: ${sum(t['net_profit'] for t in results['executed_trades'][-10:]):.2f}")
                
                # Show recent opportunities
                if results['opportunities']:
                    print("\n🎯 Recent Opportunities:")
                    for opp in results['opportunities'][-5:]:
                        print(f"• {opp['pair']}: {opp['buy_platform']} → {opp['sell_platform']} ({opp['profit_percentage']:.2%}, ${opp['net_profit_usd']:.2f})")
                
                # Show recent trades
                if results['executed_trades']:
                    print("\n💰 Recent Trades:")
                    for trade in results['executed_trades'][-5:]:
                        print(f"• {trade.opportunity.pair}: ${trade.net_profit:.2f} profit")
            else:
                print("No results file found")
            return
        
        if args.single:
            agent.run_single_cycle()
        elif args.continuous:
            agent.run_continuous(args.interval)
        else:
            print("Bybit to DEX Arbitrage Agent")
            print("=" * 60)
            print("🎯 Perfect for Russian users!")
            print("💰 Only Bybit + DEX platforms")
            print("🛡️ No bank involvement - No 115 FZ risk!")
            print("🔒 Only cryptocurrency transactions")
            print()
            print("📊 Features:")
            print("• Bybit ↔ Uniswap V3")
            print("• Bybit ↔ PancakeSwap V3")
            print("• Bybit ↔ Curve Finance")
            print("• Bybit ↔ SushiSwap")
            print("• Real-time price monitoring")
            print("• Automatic trade execution")
            print()
            print("Use --continuous for continuous monitoring")
            print("Use --single for single cycle")
            print("Use --status to check current status")
            
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    import os
    exit(main())