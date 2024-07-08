import { TestBed } from '@angular/core/testing';

import { NocasServiceService } from './nocas-service.service';

describe('NocasServiceService', () => {
  let service: NocasServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NocasServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
