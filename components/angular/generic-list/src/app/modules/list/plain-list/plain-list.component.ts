import {
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  Input,
  Injector,
  OnChanges,
  SimpleChange,
  Type,
  ViewChild,
  ViewContainerRef,
  ViewRef
} from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'y-plain-list',
  templateUrl: './plain-list.component.html',
  styleUrls: ['./plain-list.component.scss']
})
export class PlainListComponent implements OnChanges {
  @Input() source: Observable<any[]>;
  @Input() entryRenderer: Type<any>;
  @Input() entryEventHandler;
  @Input() entryTagName = 'fd-panel';

  @ViewChild('entries', { read: ViewContainerRef })
  entriesViewContainer: ViewContainerRef;

  data: any[];
  loaded = false;
  loading = false;
  initialized = false;
  errorMessage = '';

  constructor(
    public componentFactoryResolver: ComponentFactoryResolver,
    private changeDetector?: ChangeDetectorRef
  ) {
    this.componentFactoryResolver = componentFactoryResolver;
  }

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    for (const propName in changes) {
      if (propName === 'source' && changes[propName].currentValue) {
        this.render(changes[propName].currentValue);
      }
    }
  }

  setDelayedLoading() {
    // Only set loading status if it takes longer than defined ms
    of(0)
      .pipe(delay(this.initialized ? 750 : 350))
      .subscribe(() => {
        if (!this.loaded) {
          this.setLoading(true);
        }
      });
  }

  setLoading(status: boolean): void {
    this.loading = status;
  }

  setLoaded(status: boolean): void {
    this.loaded = status;
    if (!this.initialized && status) {
      this.initialized = status;
    }
  }

  render(source: Observable<any[]>) {
    this.setLoaded(false);
    this.setDelayedLoading();
    source.subscribe(
      data => {
        this.setLoaded(true);
        this.setLoading(false);
        this.errorMessage = '';
        this.data = data;
        this.entriesViewContainer.clear();
        data.forEach(entry => {
          const inputProviders = [
            { provide: 'entry', useValue: entry },
            { provide: 'entryEventHandler', useValue: this.entryEventHandler }
          ];
          const injector = Injector.create({
            providers: inputProviders,
            parent: this.entriesViewContainer.parentInjector
          });
          const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
            this.entryRenderer
          );
          const entryTag = this.entryTagName
            ? document.createElement(this.entryTagName)
            : undefined;
          const component = componentFactory.create(injector, [], entryTag);
          this.entriesViewContainer.insert(component.hostView);
        });

        if (
          this.changeDetector &&
          !(this.changeDetector as ViewRef).destroyed
        ) {
          this.changeDetector.detectChanges();
        }
      },
      error => {
        this.setLoaded(true);
        this.setLoading(false);

        this.errorMessage =
          (error.error && error.error.message) || error.message || error;

        this.data = [];
        if (!(this.changeDetector as ViewRef).destroyed) {
          this.changeDetector.detectChanges();
        }
      }
    );
  }
}
