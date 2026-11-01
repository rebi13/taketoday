# PR 자동 리뷰 설정 (Claude Code GitHub Actions)

> 2026-11-01 · 설정 완료 (PR #49)
> PR이 열리거나 커밋이 추가되면 Claude가 리뷰 코멘트를 남기고, PR·이슈에서 `@claude`로 질문하거나 수정을 맡길 수 있게 한다. 확인한 문서: Claude Code GitHub Actions(code.claude.com/docs/en/github-actions).

## 한눈에 보기

| 순서 | 할 일 | 누가 | 결과 |
|---|---|---|---|
| 1 | [`/install-github-app` 실행](#1-빠른-설정) | 본인 (터미널) | Claude GitHub App 설치, 저장소 Secret, 워크플로 브랜치 ✅ |
| 2 | [워크플로 다듬기](#2-워크플로-다듬기) | Claude Code | 한국어 리뷰, 실행 상한, 커밋 규칙 맞춤 ✅ |
| 3 | [PR 머지 후 시험](#3-시험) | 본인 | 다음 PR부터 자동 리뷰 |

## 정해 둔 것

| 항목 | 결정 | 이유 |
|---|---|---|
| 방식 | `anthropics/claude-code-action@v1` 워크플로 | 저장소에 파일로 남아 트리거·모델·지시문을 직접 고칠 수 있다. 워크플로 없이 켜는 Code Review 기능도 있지만 요금제 조건을 따로 확인해야 한다 |
| 인증 | Claude 구독 토큰 → Secret `CLAUDE_CODE_OAUTH_TOKEN` | API 별도 결제가 없다. 실행은 구독 사용량에서 차감된다. OpenAI 등 다른 API는 필요 없다 |
| 워크플로 | 두 개: 자동 리뷰(`claude-code-review.yml`) + `@claude` 응답(`claude.yml`) | 리뷰는 PR마다 자동으로, 수정 요청은 필요할 때만 |
| 리뷰 기준 | 저장소의 `CLAUDE.md`(층 간 import, 도메인 규칙, UI 규칙, 문구 원칙) | Claude가 실행할 때마다 읽는다. 기준을 바꾸려면 CLAUDE.md를 고친다 |
| 리뷰 언어 | 한국어 | `claude_args`에 지시를 덧붙인다(아래 2번) |

## 1. 빠른 설정

준비: `gh auth login`이 되어 있어야 한다(이 저장소는 이미 됨). 저장소 관리자 권한이 필요하다.

1. 저장소 폴더에서 `claude`를 열고 `/install-github-app`을 실행한다.
2. 안내대로 **Claude GitHub App**을 `rebi13/taketoday`에 설치한다.
   - 앱 권한은 Claude의 여러 기능이 같이 쓰는 묶음이라 일부만 고를 수 없다. 이 워크플로가 실제로 쓰는 건 Contents·Issues·Pull requests 읽기·쓰기다.
3. 인증 방식에서 **Claude 구독으로 장기 토큰 만들기**를 고른다. 저장소 Secret `CLAUDE_CODE_OAUTH_TOKEN`으로 저장된다.
   - 직접 만들려면 터미널에서 `claude setup-token` → 나온 토큰을 GitHub 저장소 Settings → Secrets and variables → Actions → New repository secret에 `CLAUDE_CODE_OAUTH_TOKEN`으로 넣는다.
   - 토큰은 채팅·이슈·커밋에 붙이지 않는다.
4. 워크플로는 **두 개 다** 고른다(`@claude` 응답, 자동 코드 리뷰).
5. Claude Code가 워크플로 파일을 새 브랜치에 push하고 PR 만들기 화면을 연다. **바로 머지하지 말고** 2번을 먼저 한다.

중간에 멈추려면 Esc. 앱만 설치하고 나머지를 미루려면 "Skip for now"를 고르고 나중에 다시 실행한다.

## 2. 워크플로 다듬기

1번에서 만들어진 브랜치에서 Claude Code에 맡긴다. 할 일:

| 고칠 것 | 내용 | 이유 |
|---|---|---|
| 커밋 메시지 | `ci: PR 자동 리뷰와 @claude 워크플로 추가` 형식으로 바꾼다 | CI가 PR 커밋을 commitlint로 검사한다(docs/commit-convention.md). 자동 생성된 메시지는 형식이 다를 수 있다 |
| 리뷰 언어·기준 | 리뷰 워크플로의 `claude_args`에 `--append-system-prompt "리뷰 코멘트는 한국어로 쓴다. CLAUDE.md와 docs/adr의 규칙을 기준으로 본다."` | 기본 리뷰는 영어로 나올 수 있다 |
| 실행 상한 | job에 `timeout-minutes`(리뷰 20분, `@claude` 30분) | 구독 사용량과 Actions 시간을 아낀다. 리뷰는 여러 단계로 돌아 `--max-turns`를 걸면 중간에 끊길 수 있어 쓰지 않는다 |
| 동시 실행 | `concurrency: { group: claude-review-${{ github.event.pull_request.number }}, cancel-in-progress: true }` | 커밋을 연달아 올리면 이전 리뷰를 취소한다 |
| `checkout` 버전 | `actions/checkout@v7` | 기존 `ci.yml`과 맞춘다 |
| 문서 | 구현 계획 변경 이력 한 줄, 이 문서 상태를 "설정 완료"로 | CLAUDE.md "문서와 커밋" 규칙 |

참고로 리뷰 워크플로의 핵심 부분은 이런 모양이다(공식 예시, 인증만 구독 토큰으로 바꿈).

```yaml
on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          plugin_marketplaces: "https://github.com/anthropics/claude-plugins-official.git"
          plugins: "code-review@claude-plugins-official"
          prompt: "/code-review:code-review --comment ${{ github.repository }}/pull/${{ github.event.pull_request.number }}"
          claude_args: '--allowedTools "mcp__github_inline_comment__create_inline_comment"'
```

- `--comment`가 있어야 리뷰가 PR 코멘트로 남는다. 없으면 Actions 실행 로그에만 남는다.
- `claude_args`의 `--allowedTools` 줄은 지우지 않는다. 이 줄이 있어야 인라인 코멘트 도구가 켜진다. 2번에서 옵션을 덧붙일 때 이 줄에 이어 쓴다.

## 3. 시험

1. 2번 PR을 머지한다. 워크플로 파일이 기본 브랜치(main)에 있는 것과 같아야 실행된다. 워크플로를 추가·수정하는 PR에서는 리뷰가 "workflow validation"으로 건너뛰어지는데 정상이다.
2. 다음 PR을 열면 Actions 탭에 리뷰 실행이 생기고, PR에 인라인 코멘트나 요약 코멘트가 달린다.
3. PR 코멘트에 `@claude 이 함수 테스트 케이스 추가해 줘`처럼 써서 응답을 확인한다.

리뷰가 건너뛰어지는 경우: 초안(draft) PR, 닫힌 PR, Claude가 리뷰가 필요 없다고 판단한 작은 PR, 이미 Claude 코멘트가 있는 PR.

## 알아 둘 것

| 항목 | 내용 |
|---|---|
| 비용 | GitHub Actions 시간 + Claude 구독 사용량. 이 저장소는 공개(public)라 GitHub 호스트 러너 시간은 무료다 |
| 포크 PR | 공개 저장소라도 포크에서 온 PR에는 GitHub가 Secret을 주지 않아 리뷰가 돌지 않는다. 같은 저장소 브랜치의 PR만 리뷰된다 |
| 실행 권한 | 저장소 쓰기 권한이 있는 사람만 `@claude`를 부를 수 있다. 봇 계정은 기본으로 막혀 있다 |
| 토큰 | 구독 토큰은 `claude setup-token`을 실행한 사람의 구독에 묶인다. 다른 사람과 함께 쓰게 되면 Claude Console API 키로 바꾸는 것을 다시 본다 |
| 끄기 | `.github/workflows/`의 두 파일을 지우면 멈춘다. Secret을 지워도 토큰 자체는 살아 있다 |
| 리뷰 기준 갱신 | 리뷰가 놓치는 규칙이 있으면 CLAUDE.md에 한 줄로 추가한다. 매 실행마다 읽으므로 짧게 유지한다 |
