// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { QueueNames } from 'src/packages/queues/base';
import { QueuesService } from 'src/packages/queues/queues.service';
import projectABI from './abi/influencerABI';
const Web3 = require('web3');

let codeBlockChecking = 0;
@Injectable()
export class Web3Service {
  constructor(
    private queuesService: QueuesService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {
    this.init();
  }
  public contractAddress = process.env.SMART_CONTRACT_ADDR;
  public ethProvider = process.env.RPC_URL;
  public web3: any;
  public contract: any;
  public web3Wss: any;

  private async init() {
    this.initNormalizeWeb3();
  }
  private initNormalizeWeb3() {
    this.web3 = new Web3(this.ethProvider);
    this.contract = new this.web3.eth.Contract(projectABI as any, this.contractAddress);
  }
  public async getPastEvents() {
    const redisBlockKey = 'web3_block_read';
    const redisBlockRead: any = await this.cacheService.get(redisBlockKey);
    // if (!codeBlockChecking) codeBlockChecking = parseInt(redisBlockRead) || 500204
    if (!codeBlockChecking) codeBlockChecking = parseInt(redisBlockRead) || 501405;
    const pastEvents = await this.contract.getPastEvents('allEvents', {
      fromBlock: codeBlockChecking + 1,
      toBlock: 'latest',
    });
    console.log('pastEvents :::: ', pastEvents);
    for (const val of pastEvents) {
      // console.log('val.returnValues :::: ', val.returnValues);
      codeBlockChecking = val.blockNumber;
      await this.cacheService.set(redisBlockKey, codeBlockChecking);
      let obj: any = {
        eventName: val.event,
      };
      let sendData = false;
      switch (val.event) {
        case 'IdentityCreated':
          {
            sendData = true;
            const { owner, name, role = 1, description = null } = val.returnValues;
            obj = { ...obj, owner, name, role, description };
          }
          break;
        case 'DealCreated':
          {
            sendData = true;
            const { dealId, dealName, brand, totalBudget, influencers, ratingRanges } =
              val.returnValues;
            const totalBudgetPrice = totalBudget / 10 ** 18;
            obj = {
              ...obj,
              dealId,
              dealName,
              brand,
              totalBudget,
              totalBudgetPrice,
              influencers,
              ratingRanges,
            };
          }
          break;
        case 'DealAccepted':
          sendData = true;
          break;
        case 'DealRejected':
          sendData = true;
          break;
        case 'RewardReleased': {
          sendData = true;
          const { dealId, influencer, rewardAmount, rating } = val.returnValues;
          obj = { ...obj, dealId, influencer, rewardAmount, rating, trx: val.transactionHash };
          break;
        }
        default:
      }
      if (sendData) await this.queuesService.pushMessage(QueueNames.EventParser, obj);
    }
  }
}
