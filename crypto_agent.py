#!/usr/bin/env python3
"""
Crypto Earning Automated Agent
Automated web agent for cryptocurrency earning through P2P trading, DeFi investments, and international freelance
"""

import json
import requests
import time
import random
import logging
import argparse
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import re
import csv
import os

# Configuration
CONFIG_FILE = "crypto_agent_config.json"
INPUT_FILE = "crypto_agent_input.txt"
LOG_FILE = "crypto_agent_logs.txt"

class AgentStatus(Enum):
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"
    PAUSED = "paused"

@dataclass
class P2POpportunity:
    exchange: str
    crypto: str
    price: float
    payment_method: str
    volume: float
    profit_potential: float
    timestamp: datetime

@dataclass
class DeFiYield:
    protocol: str
    token: str
    apy: float
    tvl: float
    timestamp: datetime

@dataclass
class FreelanceOpportunity:
    platform: str
    title: str
    budget: float
    requirements: str
    match_score: float
    timestamp: datetime

class CryptoEarningAgent:
    def __init__(self, config_file: str = CONFIG_FILE):
        self.config = self.load_config(config_file)
        self.status = AgentStatus.STOPPED
        self.logger = self.setup_logging()
        self.session = requests.Session()
        self.user_agents = self.config["crypto_earning_agent"]["agent_settings"]["user_agents"]
        self.results = {
            "p2p_opportunities": [],
            "defi_yields": [],
            "freelance_opportunities": [],
            "arbitrage_opportunities": [],
            "errors": []
        }
        
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
        logger = logging.getLogger('crypto_agent')
        logger.setLevel(getattr(logging, self.config["crypto_earning_agent"]["logging"]["level"]))
        
        # File handler
        file_handler = logging.FileHandler(self.config["crypto_earning_agent"]["logging"]["file_path"])
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
    
    def get_random_user_agent(self) -> str:
        """Get random user agent for requests"""
        return random.choice(self.user_agents)
    
    def make_request(self, url: str, params: Dict = None, headers: Dict = None) -> Optional[requests.Response]:
        """Make HTTP request with retry logic"""
        headers = headers or {}
        headers['User-Agent'] = self.get_random_user_agent()
        
        for attempt in range(self.config["crypto_earning_agent"]["agent_settings"]["retries"]):
            try:
                response = self.session.get(url, params=params, headers=headers, 
                                          timeout=self.config["crypto_earning_agent"]["agent_settings"]["timeout"])
                response.raise_for_status()
                return response
            except requests.RequestException as e:
                self.logger.warning(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt < self.config["crypto_earning_agent"]["agent_settings"]["retries"] - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    self.logger.error(f"Request failed after {attempt + 1} attempts")
                    return None
        
        return None
    
    def parse_p2p_data(self, exchange: str, response: requests.Response) -> List[P2POpportunity]:
        """Parse P2P platform data"""
        opportunities = []
        
        try:
            if exchange == "bybit":
                # Parse Bybit P2P data
                # This is a simplified example - actual parsing depends on the website structure
                content = response.text
                prices = re.findall(r'(\d+\.\d+)\s*USDT', content)
                volumes = re.findall(r'(\d+)\s*USDT', content)
                
                for i, price in enumerate(prices[:10]):  # Limit to first 10 results
                    opportunity = P2POpportunity(
                        exchange=exchange,
                        crypto="USDT",
                        price=float(price),
                        payment_method="bank_transfer",
                        volume=float(volumes[i]) if i < len(volumes) else 1000,
                        profit_potential=0.0,  # Will be calculated later
                        timestamp=datetime.now()
                    )
                    opportunities.append(opportunity)
                    
            elif exchange == "kucoin":
                # Parse KuCoin P2P data
                content = response.text
                prices = re.findall(r'(\d+\.\d+)\s*RUB', content)
                
                for price in prices[:10]:
                    opportunity = P2POpportunity(
                        exchange=exchange,
                        crypto="USDT",
                        price=float(price),
                        payment_method="bank_transfer",
                        volume=1000,
                        profit_potential=0.0,
                        timestamp=datetime.now()
                    )
                    opportunities.append(opportunity)
                    
            elif exchange == "localcryptos":
                # Parse LocalCryptos data
                content = response.text
                prices = re.findall(r'(\d+\.\d+)\s*RUB', content)
                
                for price in prices[:10]:
                    opportunity = P2POpportunity(
                        exchange=exchange,
                        crypto="USDT",
                        price=float(price),
                        payment_method="bank_transfer",
                        volume=1000,
                        profit_potential=0.0,
                        timestamp=datetime.now()
                    )
                    opportunities.append(opportunity)
                    
        except Exception as e:
            self.logger.error(f"Error parsing {exchange} data: {e}")
            self.results["errors"].append(f"Parsing {exchange}: {e}")
        
        return opportunities
    
    def find_p2p_arbitrage(self) -> List[P2POpportunity]:
        """Find P2P arbitrage opportunities"""
        arbitrage_opportunities = []
        
        # Get data from all P2P platforms
        all_opportunities = []
        
        for exchange, config in self.config["crypto_earning_agent"]["target_sites"]["p2p_platforms"].items():
            response = self.make_request(config["url"])
            if response:
                opportunities = self.parse_p2p_data(exchange, response)
                all_opportunities.extend(opportunities)
        
        # Find arbitrage opportunities
        if len(all_opportunities) >= 2:
            # Group by crypto
            crypto_groups = {}
            for opp in all_opportunities:
                if opp.crypto not in crypto_groups:
                    crypto_groups[opp.crypto] = []
                crypto_groups[opp.crypto].append(opp)
            
            # Find price differences
            for crypto, opportunities in crypto_groups.items():
                if len(opportunities) >= 2:
                    min_price = min(opp.price for opp in opportunities)
                    max_price = max(opp.price for opp in opportunities)
                    
                    if max_price - min_price > self.config["crypto_earning_agent"]["arbitrage_settings"]["min_profit_threshold"]:
                        # Calculate profit potential
                        for opp in opportunities:
                            if opp.price == min_price:
                                opp.profit_potential = (max_price - min_price) / min_price
                                arbitrage_opportunities.append(opp)
        
        # Store results
        self.results["arbitrage_opportunities"] = arbitrage_opportunities
        return arbitrage_opportunities
    
    def monitor_defi_protocols(self) -> List[DeFiYield]:
        """Monitor DeFi protocol yields"""
        yields = []
        
        for protocol, config in self.config["crypto_earning_agent"]["target_sites"]["defi_protocols"].items():
            response = self.make_request(config["url"])
            if response:
                try:
                    # Simplified parsing - actual implementation depends on the website
                    content = response.text
                    apy_matches = re.findall(r'(\d+\.\d+)%', content)
                    
                    if apy_matches:
                        apy = float(apy_matches[0]) / 100  # Convert percentage to decimal
                        
                        if apy >= self.config["crypto_earning_agent"]["defi_settings"]["min_apy_threshold"]:
                            yield_data = DeFiYield(
                                protocol=protocol,
                                token=config["form_fields"]["token"],
                                apy=apy,
                                tvl=1000000,  # Simplified TVL
                                timestamp=datetime.now()
                            )
                            yields.append(yield_data)
                            
                except Exception as e:
                    self.logger.error(f"Error parsing {protocol} data: {e}")
                    self.results["errors"].append(f"DeFi {protocol}: {e}")
        
        # Store results
        self.results["defi_yields"] = yields
        return yields
    
    def search_freelance_opportunities(self) -> List[FreelanceOpportunity]:
        """Search for freelance opportunities"""
        opportunities = []
        
        for platform, config in self.config["crypto_earning_agent"]["target_sites"]["freelance_platforms"].items():
            response = self.make_request(config["url"])
            if response:
                try:
                    # Simplified parsing - actual implementation depends on the website
                    content = response.text
                    
                    # Find freelance opportunities
                    if platform == "upwork":
                        # Parse Upwork results
                        titles = re.findall(r'<h3 class="job-title">([^<]+)</h3>', content)
                        budgets = re.findall(r'<span class="budget">\$([\d,]+)</span>', content)
                        
                        for i, title in enumerate(titles[:10]):
                            budget = float(budgets[i].replace(',', '')) if i < len(budgets) else 100
                            
                            # Calculate match score (simplified)
                            match_score = 0.8 if "crypto" in title.lower() or "blockchain" in title.lower() else 0.5
                            
                            opportunity = FreelanceOpportunity(
                                platform=platform,
                                title=title,
                                budget=budget,
                                requirements="Crypto/Blockchain development",
                                match_score=match_score,
                                timestamp=datetime.now()
                            )
                            opportunities.append(opportunity)
                            
                    elif platform == "toptal":
                        # Parse Toptal results
                        titles = re.findall(r'<h2 class="project-title">([^<]+)</h2>', content)
                        
                        for title in titles[:5]:
                            match_score = 0.9 if "blockchain" in title.lower() else 0.6
                            
                            opportunity = FreelanceOpportunity(
                                platform=platform,
                                title=title,
                                budget=500,  # Average Toptal budget
                                requirements="High-end development",
                                match_score=match_score,
                                timestamp=datetime.now()
                            )
                            opportunities.append(opportunity)
                            
                    elif platform == "fiverr":
                        # Parse Fiverr results
                        titles = re.findall(r'<h3 class="gig-title">([^<]+)</h3>', content)
                        
                        for title in titles[:15]:
                            match_score = 0.7 if "crypto" in title.lower() else 0.4
                            
                            opportunity = FreelanceOpportunity(
                                platform=platform,
                                title=title,
                                budget=50,  # Average Fiverr budget
                                requirements="Gig services",
                                match_score=match_score,
                                timestamp=datetime.now()
                            )
                            opportunities.append(opportunity)
                            
                except Exception as e:
                    self.logger.error(f"Error parsing {platform} data: {e}")
                    self.results["errors"].append(f"Freelance {platform}: {e}")
        
        # Store results
        self.results["freelance_opportunities"] = opportunities
        return opportunities
    
    def generate_alerts(self) -> Dict[str, List[str]]:
        """Generate alerts based on thresholds"""
        alerts = {
            "p2p_arbitrage": [],
            "defi_yield": [],
            "freelance_opportunity": []
        }
        
        # P2P arbitrage alerts
        for opp in self.results["arbitrage_opportunities"]:
            if opp.profit_potential >= self.config["crypto_earning_agent"]["output_settings"]["alert_thresholds"]["p2p_arbitrage"]:
                alerts["p2p_arbitrage"].append(
                    f"{opp.exchange}: {opp.profit_potential:.2%} profit potential"
                )
        
        # DeFi yield alerts
        for yield_data in self.results["defi_yields"]:
            if yield_data.apy >= self.config["crypto_earning_agent"]["output_settings"]["alert_thresholds"]["defi_yield"]:
                alerts["defi_yield"].append(
                    f"{yield_data.protocol}: {yield_data.apy:.2%} APY"
                )
        
        # Freelance opportunity alerts
        for opp in self.results["freelance_opportunities"]:
            if opp.match_score >= self.config["crypto_earning_agent"]["output_settings"]["alert_thresholds"]["freelance_opportunity"]:
                alerts["freelance_opportunity"].append(
                    f"{opp.platform}: {opp.title} (${opp.budget})"
                )
        
        return alerts
    
    def save_results(self) -> None:
        """Save results to files"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save JSON results
        results_file = f"crypto_agent_results_{timestamp}.json"
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        # Save CSV reports
        self.save_csv_report(timestamp)
        
        # Save alerts
        alerts = self.generate_alerts()
        alerts_file = f"crypto_agent_alerts_{timestamp}.txt"
        with open(alerts_file, 'w', encoding='utf-8') as f:
            for alert_type, alert_list in alerts.items():
                f.write(f"{alert_type.upper()} ALERTS:\n")
                for alert in alert_list:
                    f.write(f"  - {alert}\n")
                f.write("\n")
        
        self.logger.info(f"Results saved to {results_file}")
        self.logger.info(f"Alerts saved to {alerts_file}")
    
    def save_csv_report(self, timestamp: str) -> None:
        """Save CSV report"""
        report_file = f"crypto_agent_report_{timestamp}.csv"
        
        with open(report_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Write P2P opportunities
            writer.writerow(["P2P Arbitrage Opportunities"])
            writer.writerow(["Exchange", "Crypto", "Price", "Payment Method", "Volume", "Profit Potential", "Timestamp"])
            for opp in self.results["arbitrage_opportunities"]:
                writer.writerow([
                    opp.exchange, opp.crypto, opp.price, opp.payment_method,
                    opp.volume, opp.profit_potential, opp.timestamp
                ])
            
            writer.writerow([])
            
            # Write DeFi yields
            writer.writerow(["DeFi Yields"])
            writer.writerow(["Protocol", "Token", "APY", "TVL", "Timestamp"])
            for yield_data in self.results["defi_yields"]:
                writer.writerow([
                    yield_data.protocol, yield_data.token, yield_data.apy,
                    yield_data.tvl, yield_data.timestamp
                ])
            
            writer.writerow([])
            
            # Write freelance opportunities
            writer.writerow(["Freelance Opportunities"])
            writer.writerow(["Platform", "Title", "Budget", "Requirements", "Match Score", "Timestamp"])
            for opp in self.results["freelance_opportunities"]:
                writer.writerow([
                    opp.platform, opp.title, opp.budget, opp.requirements,
                    opp.match_score, opp.timestamp
                ])
    
    def run_cycle(self) -> None:
        """Run one complete monitoring cycle"""
        self.logger.info("Starting crypto agent monitoring cycle...")
        
        try:
            # Monitor P2P platforms
            self.logger.info("Monitoring P2P platforms...")
            p2p_opportunities = self.find_p2p_arbitrage()
            self.logger.info(f"Found {len(p2p_opportunities)} P2P arbitrage opportunities")
            
            # Monitor DeFi protocols
            self.logger.info("Monitoring DeFi protocols...")
            defi_yields = self.monitor_defi_protocols()
            self.logger.info(f"Found {len(defi_yields)} DeFi yield opportunities")
            
            # Search freelance opportunities
            self.logger.info("Searching freelance opportunities...")
            freelance_opportunities = self.search_freelance_opportunities()
            self.logger.info(f"Found {len(freelance_opportunities)} freelance opportunities")
            
            # Generate and save results
            self.save_results()
            
            # Generate alerts
            alerts = self.generate_alerts()
            if any(alerts.values()):
                self.logger.info("ALERTS:")
                for alert_type, alert_list in alerts.items():
                    if alert_list:
                        self.logger.info(f"{alert_type}: {len(alert_list)} alerts")
                        for alert in alert_list:
                            self.logger.info(f"  - {alert}")
            
            self.logger.info("Monitoring cycle completed successfully")
            
        except Exception as e:
            self.logger.error(f"Error in monitoring cycle: {e}")
            self.results["errors"].append(f"Cycle error: {e}")
            self.status = AgentStatus.ERROR
    
    def run_continuous(self, interval_minutes: int = 60) -> None:
        """Run agent continuously"""
        self.status = AgentStatus.RUNNING
        self.logger.info(f"Starting continuous monitoring with {interval_minutes} minute intervals")
        
        while self.status == AgentStatus.RUNNING:
            try:
                self.run_cycle()
                time.sleep(interval_minutes * 60)
            except KeyboardInterrupt:
                self.logger.info("Received keyboard interrupt, stopping...")
                self.status = AgentStatus.STOPPED
                break
            except Exception as e:
                self.logger.error(f"Error in continuous mode: {e}")
                time.sleep(60)  # Wait before retrying
    
    def run_single_cycle(self) -> None:
        """Run single monitoring cycle"""
        self.status = AgentStatus.RUNNING
        self.run_cycle()
        self.status = AgentStatus.STOPPED
    
    def stop(self) -> None:
        """Stop the agent"""
        self.status = AgentStatus.STOPPED
        self.logger.info("Agent stopped")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            "status": self.status.value,
            "timestamp": datetime.now().isoformat(),
            "results_count": {
                "p2p_opportunities": len(self.results["arbitrage_opportunities"]),
                "defi_yields": len(self.results["defi_yields"]),
                "freelance_opportunities": len(self.results["freelance_opportunities"]),
                "errors": len(self.results["errors"])
            }
        }

def main():
    parser = argparse.ArgumentParser(description="Crypto Earning Automated Agent")
    parser.add_argument("--config", default=CONFIG_FILE, help="Configuration file path")
    parser.add_argument("--input", default=INPUT_FILE, help="Input data file path")
    parser.add_argument("--continuous", action="store_true", help="Run continuously")
    parser.add_argument("--interval", type=int, default=60, help="Interval in minutes for continuous mode")
    parser.add_argument("--single", action="store_true", help="Run single cycle only")
    parser.add_argument("--status", action="store_true", help="Show current status")
    parser.add_argument("--logs", action="store_true", help="Show recent logs")
    
    args = parser.parse_args()
    
    try:
        agent = CryptoEarningAgent(args.config)
        
        if args.status:
            status = agent.get_status()
            print(json.dumps(status, indent=2))
            return
        
        if args.logs:
            if os.path.exists(LOG_FILE):
                with open(LOG_FILE, 'r', encoding='utf-8') as f:
                    print(f.read())
            else:
                print("No log file found")
            return
        
        if args.single:
            agent.run_single_cycle()
        elif args.continuous:
            agent.run_continuous(args.interval)
        else:
            print("Use --continuous for continuous monitoring or --single for single cycle")
            print("Use --status to check current status")
            print("Use --logs to view recent logs")
            
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())