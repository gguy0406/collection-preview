import { Component, NgZone, SecurityContext, ViewChild } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild(MatAccordion) accordion!: MatAccordion;
  @ViewChild('preview') preview!: HTMLDivElement;

  title = 'collection-preview';
  traits: string[] = [];
  traitCount: { [trait: string]: number } = {};
  elementCount: { [trait: string]: { [element: string]: number } } = {};
  elementSelect: { [trait: string]: { [element: string]: boolean } } = {};
  metadata: Array<{ id: string; [trait: string]: string }> = [];
  filteredMetadata: Array<{ id: string; [trait: string]: string }> = [];
  images: { [id: string]: string | null } = {};

  constructor(private _ngZone: NgZone, private _sanitizer: DomSanitizer) {}

  onMetadataSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;

    if (!files) return;

    this.traits = [];

    const reader = new FileReader();

    reader.readAsText(files[0]);
    reader.onload = () => {
      const data = JSON.parse(reader.result as string);

      Object.keys(data).forEach((trait) => {
        this.traits.push(trait);
        this.traitCount[trait] = 0;
        this.elementCount[trait] = {};
        this.elementSelect[trait] = {};
      });
    };

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();

      this._ngZone.runOutsideAngular(() => {
        reader.onload = () => {
          const data = JSON.parse(reader.result as string);

          this.metadata.push({
            ...data,
            id: files[i].name.replace(/\.[^/.]+$/, ''),
          });

          Object.entries(data as { [trait: string]: string }).forEach(
            ([trait, element]) => {
              if (!this.elementCount[trait][element]) {
                this.elementCount[trait][element] = 1;
                this.traitCount[trait]++;
              } else {
                this.elementCount[trait][element]++;
              }
            }
          );
        };
      });

      reader.readAsText(files[i]);
    }
  }

  filterMetadata(trait: string, element: string, checked: boolean) {
    this.elementSelect[trait][element] = checked;

    if (checked) {
      this.filteredMetadata = this.metadata.filter((item) =>
        Object.entries(item).some(
          ([trait, element]) => this.elementSelect[trait]?.[element]
        )
      );
    } else {
      this.filteredMetadata = this.filteredMetadata.filter(
        (item) => item[trait] !== element
      );
    }
  }

  onImageSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;

    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();

      this._ngZone.runOutsideAngular(() => {
        reader.onload = () => {
          const image = new Image();

          image.height = 300;
          image.src = reader.result as string;
          this.images[files[i].name.replace(/\.[^/.]+$/, '')] =
            this._sanitizer.sanitize(SecurityContext.HTML, image.outerHTML);
        };
      });

      reader.readAsDataURL(files[i]);
    }
  }
}
