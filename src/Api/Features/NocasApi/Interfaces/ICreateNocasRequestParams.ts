export interface IcreateNocasRequestParams {
    user_id: string
    distance: string
    permissible_elevation: string
    permissible_height: string
    city: string
    latitude: string
    longitude: string
    airport_name: string
    site_elevation: string
    snapshot: string,
    subscription_id: string
  };

  export interface ICreateNocasResponseEntity {
    newNocasEntry: INocasEntity
    freeTrialCount: number
    isOneTimeSubscription: boolean
    isSubscribed?: boolean

  }
  
  export interface INocasEntity {
    request_id: string
    user_id: string
    city: string
    airport_name: string
    latitude: string
    longitude: string
    site_elevation: string
    snapshot: string
    distance: string
    permissible_elevation: string
    permissible_height: string
    updatedAt: string
    createdAt: string
  }