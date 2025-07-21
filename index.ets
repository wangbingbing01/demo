import { ComponentContent, UIContext } from '@kit.ArkUI';

class Params {
  text: string = "";
  closeDialog?: () => void;
  secondsLeft: number = 0;
  constructor(text: string, closeDialog?: () => void, secondsLeft: number = 0) {
    this.text = text;
    this.closeDialog = closeDialog;
    this.secondsLeft = secondsLeft;
  }
}

@Builder
function buildDialog(params: Params) {
  Column() {
    Text(params.text)
      .fontSize(20)
      .fontWeight(FontWeight.Bold)
      .margin({ bottom: 10 })
    Text(`${params.secondsLeft}秒后自动确认`)
      .fontSize(16)
      .fontColor('#FF0000')
      .margin({ bottom: 20 })
    Row() {
      Button('确认')
        .onClick(() => {
          params.closeDialog && params.closeDialog();
        })
      Button('取消')
        .margin({ left: 20 })
        .onClick(() => {
          params.closeDialog && params.closeDialog();
        })
    }
  }.padding(20).backgroundColor('#FFF0F0F0')
}
@Entry
@Component
struct Index {
  // ...existing code...
  private ctx: UIContext = this.getUIContext();
  private closeTimer: number | undefined = undefined;
  private countdownTimer: number | undefined = undefined;
  private secondsLeft: number = 3;
  private contentNode: ComponentContent<Object> | undefined = undefined;

  private closeDialog() {
    if (this.closeTimer !== undefined) {
      clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
    if (this.countdownTimer !== undefined) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
    if (this.contentNode !== undefined) {
      this.ctx.getPromptAction().closeCustomDialog(this.contentNode)
        .then(() => {
          if (this.contentNode !== undefined) {
            this.contentNode.dispose();
          }
        })
    }
  }

  build() {
    RelativeContainer() {
      Button('弹出自定义弹框')
        .alignRules({
          center: { anchor: '__container__', align: VerticalAlign.Center },
          middle: { anchor: '__container__', align: HorizontalAlign.Center }
        })
        .onClick(() => {
          this.secondsLeft = 3;
          this.secondsLeft = 3;
          this.contentNode = new ComponentContent(this.ctx, wrapBuilder(buildDialog), new Params('这是一个自定义弹框', this.closeDialog.bind(this), this.secondsLeft));
          this.ctx.getPromptAction().openCustomDialog(this.contentNode, { alignment: DialogAlignment.Center })
            .then(() => {
              this.countdownTimer = setInterval(() => {
                if (this.secondsLeft > 1) {
                  this.secondsLeft--;
                  // 只更新弹框参数，不重新弹框
                  if (this.contentNode) {
                    this.contentNode.update(new Params('这是一个自定义弹框', this.closeDialog.bind(this), this.secondsLeft));
                  }
                } else {
                  this.closeDialog();
                }
              }, 1000);
            })
        })
    }
    .height('100%')
    .width('100%')
  }
}
