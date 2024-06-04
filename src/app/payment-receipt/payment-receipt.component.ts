import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-payment-receipt',
  templateUrl: './payment-receipt.component.html',
  styleUrls: ['./payment-receipt.component.scss']
})
export class PaymentReceiptComponent implements OnInit {
  receiptDetails: any; // Define the type explicitly

  constructor(private router: Router,private el: ElementRef) {
    const navigation = this.router.getCurrentNavigation();
    this.receiptDetails = navigation?.extras?.state?.['receiptDetails'];
    
  }
  
  isGeneratingPdf: boolean = false;

  

  ngOnInit(): void {
    if (!this.receiptDetails) {
      this.router.navigate(['UsersPricingPlans']);
    }
    

  }

  
 
  printReceipt() {
    window.print();
  }

  downloadPdf() {
    
    const data = this.el.nativeElement.querySelector('.table-container');

    html2canvas(data).then(canvas => {
      const contentDataURL = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 208;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('payment_receipt.pdf');
    });
  }
}
