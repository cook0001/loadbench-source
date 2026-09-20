## Description
<!-- Provide a clear, concise summary of the changes and motivation behind them. -->

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] ⚡ Performance / Solver optimization
- [ ] 🎨 UI/UX styling & responsiveness
- [ ] 🔧 Build / CI/CD / Dependencies

## Pre-Submission Quality Checklist
- [ ] **Frontend TypeScript**: Ran `npm run typecheck` (`tsc --noEmit`) with zero errors.
- [ ] **Production Bundle**: Ran `npm run build` and client bundle builds cleanly.
- [ ] **Rust Backend**: Ran `cargo check` and `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` with zero warnings.
- [ ] **Ballistics Tests**: Ran `cargo test --manifest-path src-tauri/Cargo.toml` and all unit tests pass.
- [ ] **Rule #3 Strict Emoji Ban**: Zero raw emoji placeholders in UI markup; dedicated Lucide vector icons or custom SVGs only.
- [ ] **Zero-Cloud Architecture**: Confirmed all load profiles, bullet dimensions, and telemetry data remain strictly local.
- [ ] **Documentation**: Documented changes in `CHANGELOG.md` under the appropriate header.
