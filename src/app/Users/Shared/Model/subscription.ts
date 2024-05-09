export class Subscription {
    constructor(
        public subscription_id: string,
        public user_id: string,
        public subscription_status: string,
        public expiry_date: string,
        public subscription_type: string,
        public price: string,
      
    ) {
    }
}

